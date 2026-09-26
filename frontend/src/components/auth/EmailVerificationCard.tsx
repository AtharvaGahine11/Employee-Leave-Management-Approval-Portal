import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { auth, sendEmailVerification } from '../../config/firebase';
import { useToast } from '../../contexts/ToastContext';

interface EmailVerificationCardProps {
  email: string;
  userName?: string;
  onVerified: () => Promise<void>;
  onCancel: () => void;
}

export const EmailVerificationCard: React.FC<EmailVerificationCardProps> = ({
  email,
  userName,
  onVerified,
  onCancel,
}) => {
  const { showError, showSuccess } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Real-time automatic background polling every 3.5 seconds
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (verifiedSuccess || isChecking) return;
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified && isMounted) {
            clearInterval(interval);
            setVerifiedSuccess(true);
            showSuccess('Email authorization verified! Finalizing workspace profile...');
            await onVerified();
          }
        }
      } catch (err) {
        // silent polling catch
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [verifiedSuccess, isChecking, onVerified, showSuccess]);

  // Manual Check Button
  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      if (!auth.currentUser) {
        showError('Authentication session not found. Please log in or re-register.');
        onCancel();
        return;
      }

      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setVerifiedSuccess(true);
        showSuccess('Email verified successfully! Activating your account...');
        await onVerified();
      } else {
        showError('Your email has not been verified yet. Please open the link in your inbox and try again.');
      }
    } catch (err: any) {
      console.error(err);
      showError('Could not verify status. Please verify the email in your inbox first.');
    } finally {
      setIsChecking(false);
    }
  };

  // Resend Verification Email
  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        showSuccess(`A new authorization link has been sent to ${email}`);
        setCooldown(60);
      } else {
        showError('Session expired. Please re-enter your details.');
        onCancel();
      }
    } catch (err: any) {
      console.error(err);
      showError(err.message || 'Failed to resend authorization link. Please wait a moment.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-7 sm:p-9 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Icon with glowing animation */}
      <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center relative">
        <span className="animate-ping absolute inline-flex h-12 w-12 rounded-2xl bg-indigo-400 opacity-20" />
        {verifiedSuccess ? (
          <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in duration-300" />
        ) : (
          <Mail className="w-8 h-8 text-indigo-600" />
        )}
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-3xs font-extrabold uppercase border border-amber-200/80">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Action Required • Email Authorization</span>
        </div>
        <h2 className="text-2xl font-black text-slate-950 tracking-tight">
          {verifiedSuccess ? 'Email Verified!' : 'Verify Your Work Email'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {verifiedSuccess ? (
            'Your authorization link was accepted. Activating your profile and redirecting...'
          ) : (
            <>
              We sent a secure authorization link to{' '}
              <strong className="text-slate-900 font-bold block mt-1 break-all bg-slate-50 py-1 px-2 rounded-lg border border-slate-200/60">
                {email}
              </strong>
            </>
          )}
        </p>
      </div>

      {!verifiedSuccess && (
        <>
          {/* Instructions Box */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                1
              </span>
              <span>Open your inbox for <strong>{email}</strong></span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                2
              </span>
              <span>Click the verification link from <strong>Firebase / ELAP Portal</strong></span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                3
              </span>
              <span>Return here — this screen will automatically activate your account, or click the button below!</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-slate-900 active:scale-[0.99] transition-all duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Checking Email Status...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>I've Authorized / Verified My Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0
                  ? `Resend link in ${cooldown}s`
                  : isResending
                  ? 'Dispatching email...'
                  : 'Resend Authorization Email'}
              </span>
            </button>
          </div>

          {/* Back link */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change email or back to sign in</span>
            </button>
          </div>
        </>
      )}

      {verifiedSuccess && (
        <div className="py-4 flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Redirecting to your dashboard...</span>
        </div>
      )}
    </div>
  );
};
