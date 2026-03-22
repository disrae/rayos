'use server';

import { getWorkOS, saveSession } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID ?? '';
const WORKOS_REDIRECT_URI = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? '';

function extractWorkOSErrorDetails(err: unknown) {
  if (!err || typeof err !== 'object') {
    return null;
  }
  const record = err as Record<string, unknown>;
  return {
    name: typeof record.name === 'string' ? record.name : null,
    message: typeof record.message === 'string' ? record.message : null,
    code: typeof record.code === 'string' ? record.code : null,
    status: typeof record.status === 'number' ? record.status : null,
    requestId: typeof record.requestId === 'string' ? record.requestId : null,
    rawData: record.rawData ?? null,
    errors: record.errors ?? null,
  };
}

function hasWorkOSErrorCode(details: ReturnType<typeof extractWorkOSErrorDetails>, targetCode: string): boolean {
  const errors = details?.errors;
  if (!Array.isArray(errors)) {
    return false;
  }
  return errors.some((entry) => {
    if (!entry || typeof entry !== 'object') {
      return false;
    }
    const code = (entry as { code?: unknown }).code;
    return typeof code === 'string' && code.toLowerCase() === targetCode.toLowerCase();
  });
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isEmailVerificationRequiredError(err: unknown): boolean {
  const details = extractWorkOSErrorDetails(err);
  const message = (details?.message ?? toErrorMessage(err)).toLowerCase();

  if (hasWorkOSErrorCode(details, 'email_verification_required')) {
    return true;
  }

  return (
    message.includes('email verification') ||
    message.includes('email ownership must be verified') ||
    (message.includes('email') &&
      message.includes('must be verified') &&
      message.includes('authentication'))
  );
}

function extractPendingAuthenticationToken(err: unknown): string | null {
  if (!err || typeof err !== 'object') {
    return null;
  }

  const record = err as Record<string, unknown>;
  const directToken = record.pendingAuthenticationToken;
  if (typeof directToken === 'string' && directToken.length > 0) {
    return directToken;
  }

  const details = extractWorkOSErrorDetails(err);
  const rawData = details?.rawData;
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }

  const rawRecord = rawData as Record<string, unknown>;
  const snakeCaseToken = rawRecord.pending_authentication_token;
  if (typeof snakeCaseToken === 'string' && snakeCaseToken.length > 0) {
    return snakeCaseToken;
  }

  const camelCaseToken = rawRecord.pendingAuthenticationToken;
  if (typeof camelCaseToken === 'string' && camelCaseToken.length > 0) {
    return camelCaseToken;
  }

  return null;
}

export async function signInWithPassword(
  _prev:
    | {
        error?: string;
        needsEmailVerification?: boolean;
        email?: string;
      }
    | undefined,
  formData: FormData,
): Promise<{
  error?: string;
  needsEmailVerification?: boolean;
  email?: string;
}> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    const authResponse =
      await getWorkOS().userManagement.authenticateWithPassword({
        clientId: WORKOS_CLIENT_ID,
        email,
        password,
      });

    await saveSession(authResponse, WORKOS_REDIRECT_URI);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not sign in. Please check your credentials.';

    if (isEmailVerificationRequiredError(err)) {
      return {
        error: 'Please verify your email before signing in.',
        needsEmailVerification: true,
        email,
      };
    }

    return { error: 'Invalid email or password.' };
  }

  redirect('/start');
}

export async function signUpWithPassword(
  _prev:
    | {
        error?: string;
        needsEmailVerification?: boolean;
        email?: string;
        pendingAuthenticationToken?: string;
        firstName?: string;
        lastName?: string;
        businessName?: string;
        intent?: string;
        inviteToken?: string;
      }
    | undefined,
  formData: FormData,
): Promise<{
  error?: string;
  needsEmailVerification?: boolean;
  email?: string;
  pendingAuthenticationToken?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  intent?: string;
  inviteToken?: string;
}> {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';
  const firstName = ((formData.get('firstName') as string) || '').trim();
  const lastName = ((formData.get('lastName') as string) || '').trim();
  const businessName = ((formData.get('businessName') as string) || '').trim();
  const intent = (formData.get('intent') as string) || '';
  const inviteToken = ((formData.get('inviteToken') as string) || '').trim();
  const isInviteSignup = intent === 'end-user' && !!inviteToken;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  if (!firstName || !lastName) {
    return { error: 'First name and last name are required.' };
  }
  if (!isInviteSignup && !businessName) {
    return { error: 'Business name is required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  try {
    await getWorkOS().userManagement.createUser({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  } catch (err) {
    const details = extractWorkOSErrorDetails(err);
    const message = details?.message ?? (err instanceof Error ? err.message : String(err));
    const normalized = message.toLowerCase();

    if (hasWorkOSErrorCode(details, 'email_not_available')) {
      return { error: 'An account with this email already exists.' };
    }
    if (normalized.includes('already exists') || normalized.includes('duplicate')) {
      return { error: 'An account with this email already exists.' };
    }
    if (normalized.includes('password') && normalized.includes('weak')) {
      return { error: 'Password is too weak. Please choose a stronger password.' };
    }
    if (normalized.includes('invalid') && normalized.includes('email')) {
      return { error: 'Please enter a valid email address.' };
    }
    if (normalized.includes('rate') && normalized.includes('limit')) {
      return { error: 'Too many signup attempts. Please wait a minute and try again.' };
    }
    if (normalized.includes('unauthorized') || normalized.includes('forbidden')) {
      return { error: 'Signup service is not configured correctly yet. Please contact support.' };
    }
    console.error('WorkOS createUser failed details:', details ?? message);

    if (details?.status) {
      return { error: `Could not create account (${details.status}): ${message}` };
    }
    return { error: `Could not create account: ${message}` };
  }

  // After creating the user, sign them in immediately.
  let authResponse;
  try {
    authResponse = await getWorkOS().userManagement.authenticateWithPassword({
      clientId: WORKOS_CLIENT_ID,
      email,
      password,
    });
  } catch (err) {
    const message = toErrorMessage(err);
    if (isEmailVerificationRequiredError(err)) {
      const pendingAuthenticationToken = extractPendingAuthenticationToken(err);
      if (!pendingAuthenticationToken) {
        return {
          error:
            'Account created and verification is required, but we could not start verification. Please sign in again to request a new code.',
          needsEmailVerification: false,
          email,
        };
      }
      return {
        error: 'Account created. Enter the verification code from your email to continue.',
        needsEmailVerification: true,
        email,
        pendingAuthenticationToken,
        firstName,
        lastName,
        businessName,
        intent,
        inviteToken,
      };
    }
    console.error('WorkOS authenticateWithPassword failed:', message);
    return { error: `Account created, but sign-in failed: ${message}` };
  }

  try {
    await saveSession(authResponse, WORKOS_REDIRECT_URI);
  } catch (err) {
    const message = toErrorMessage(err);
    console.error('saveSession failed after signup:', message);
    return { error: `Account created, but session setup failed: ${message}` };
  }

  if (isInviteSignup) {
    redirect(`/i/${inviteToken}`);
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const pricingParams = new URLSearchParams({ fullName, businessName });
  redirect(`/start/pricing?${pricingParams.toString()}`);
}

export async function completeSignUpWithVerificationCode(
  _prev:
    | {
        error?: string;
      }
    | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const code = ((formData.get('code') as string) || '').trim();
  const pendingAuthenticationToken = ((formData.get('pendingAuthenticationToken') as string) || '').trim();
  const firstName = ((formData.get('firstName') as string) || '').trim();
  const lastName = ((formData.get('lastName') as string) || '').trim();
  const businessName = ((formData.get('businessName') as string) || '').trim();
  const intent = ((formData.get('intent') as string) || '').trim();
  const inviteToken = ((formData.get('inviteToken') as string) || '').trim();
  const isInviteSignup = intent === 'end-user' && !!inviteToken;

  if (!code) {
    return { error: 'Verification code is required.' };
  }
  if (!pendingAuthenticationToken) {
    return { error: 'Verification session expired. Please create your account again.' };
  }

  let authResponse;
  try {
    authResponse = await getWorkOS().userManagement.authenticateWithEmailVerification({
      clientId: WORKOS_CLIENT_ID,
      code,
      pendingAuthenticationToken,
    });
  } catch (err) {
    const message = toErrorMessage(err);
    const normalized = message.toLowerCase();
    if (
      normalized.includes('invalid') ||
      normalized.includes('expired') ||
      normalized.includes('verification')
    ) {
      return { error: 'That verification code is invalid or expired. Request a new code and try again.' };
    }
    return { error: `Could not verify email: ${message}` };
  }

  try {
    await saveSession(authResponse, WORKOS_REDIRECT_URI);
  } catch (err) {
    const message = toErrorMessage(err);
    console.error('saveSession failed after email verification:', message);
    return { error: `Email verified, but session setup failed: ${message}` };
  }

  if (isInviteSignup) {
    redirect(`/i/${inviteToken}`);
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const pricingParams = new URLSearchParams({ fullName, businessName });
  redirect(`/start/pricing?${pricingParams.toString()}`);
}
