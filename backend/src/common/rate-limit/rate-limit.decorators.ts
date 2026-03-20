import { Throttle } from '@nestjs/throttler';
import {
  getAuthTargetTracker,
  getShortQueryAwareLimit,
} from './rate-limit.utils';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const LoginRateLimit = () =>
  Throttle({
    auth: {
      limit: 5,
      ttl: MINUTE,
      blockDuration: 5 * MINUTE,
      getTracker: getAuthTargetTracker,
    },
  });

export const RegisterRateLimit = () =>
  Throttle({
    auth: {
      limit: 3,
      ttl: 10 * MINUTE,
      blockDuration: 30 * MINUTE,
      getTracker: getAuthTargetTracker,
    },
  });

export const ForgotPasswordRateLimit = () =>
  Throttle({
    auth: {
      limit: 3,
      ttl: HOUR,
      blockDuration: HOUR,
      getTracker: getAuthTargetTracker,
    },
  });

export const VerifyResetTokenRateLimit = () =>
  Throttle({
    auth: {
      limit: 10,
      ttl: MINUTE,
      blockDuration: 10 * MINUTE,
      getTracker: getAuthTargetTracker,
    },
  });

export const ResetPasswordRateLimit = () =>
  Throttle({
    auth: {
      limit: 5,
      ttl: 10 * MINUTE,
      blockDuration: 30 * MINUTE,
      getTracker: getAuthTargetTracker,
    },
  });

export const SearchRateLimit = () =>
  Throttle({
    search: {
      limit: getShortQueryAwareLimit,
      ttl: MINUTE,
      blockDuration: MINUTE,
    },
  });

export const UploadRateLimit = () =>
  Throttle({
    upload: {
      limit: 20,
      ttl: MINUTE,
      blockDuration: 5 * MINUTE,
    },
  });

export const WriteRateLimit = () =>
  Throttle({
    write: {
      limit: 120,
      ttl: MINUTE,
      blockDuration: MINUTE,
    },
  });

export const DangerousWriteRateLimit = () =>
  Throttle({
    dangerous: {
      limit: 20,
      ttl: MINUTE,
      blockDuration: 2 * MINUTE,
    },
  });

export const NotificationBulkRateLimit = () =>
  Throttle({
    notificationBulk: {
      limit: 10,
      ttl: MINUTE,
      blockDuration: MINUTE,
    },
  });

export const PaymentRateLimit = () =>
  Throttle({
    payments: {
      limit: 30,
      ttl: MINUTE,
      blockDuration: 2 * MINUTE,
    },
  });

export const ReadRateLimit = () =>
  Throttle({
    read: {
      limit: 120,
      ttl: MINUTE,
      blockDuration: MINUTE,
    },
  });