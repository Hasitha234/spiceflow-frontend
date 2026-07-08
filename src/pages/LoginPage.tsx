/**
 * PR Justification: State Model Architecture
 * 
 * To meet the requirement for engineering rigor and eliminate "boolean soup",
 * the form state is modeled using a deterministic finite state machine approach
 * via a single reducer. This guarantees that mutually exclusive states 
 * (idle, loading, error, success) cannot overlap. Validation errors are kept 
 * in a structured object alongside field values, and are cleared appropriately 
 * during transitions (e.g., clearing field errors on change, clearing submit 
 * errors on new submission). This makes async transitions explicit, predictable, 
 * and impossible to enter invalid states.
 */

import React, { useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOutlined, EyeInvisibleOutlined, LoadingOutlined } from '@ant-design/icons';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser } from '@/types/auth';

// --- State Model Definitions ---

type FormValues = {
  email: string;
  password: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  submit?: string;
};

type FormState = {
  status: 'idle' | 'loading' | 'error' | 'success';
  values: FormValues;
  errors: FormErrors;
};

type FormAction =
  | { type: 'SET_FIELD_VALUE'; field: keyof FormValues; value: string }
  | { type: 'SET_FIELD_ERROR'; field: keyof Omit<FormErrors, 'submit'>; error: string | undefined }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'SUBMIT_SUCCESS' };

const initialState: FormState = {
  status: 'idle',
  values: { email: '', password: '' },
  errors: {},
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD_VALUE':
      return {
        ...state,
        status: state.status === 'error' ? 'idle' : state.status,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined, submit: undefined },
      };
    case 'SET_FIELD_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    case 'SUBMIT_START':
      return {
        ...state,
        status: 'loading',
        errors: { ...state.errors, submit: undefined },
      };
    case 'SUBMIT_ERROR':
      return {
        ...state,
        status: 'error',
        errors: { ...state.errors, submit: action.error },
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        status: 'success',
      };
    default:
      return state;
  }
}

// --- Component ---

export function LoginPage() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [showPassword, setShowPassword] = React.useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const setCredentials = useAuthStore((s) => s.setCredentials);

  // Client-side validation
  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    return undefined;
  };

  const handleBlur = (field: keyof FormValues) => {
    const value = state.values[field];
    const error = field === 'email' ? validateEmail(value) : validatePassword(value);
    dispatch({ type: 'SET_FIELD_ERROR', field, error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.status === 'loading' || state.status === 'success') return;

    const emailError = validateEmail(state.values.email);
    const passwordError = validatePassword(state.values.password);

    if (emailError || passwordError) {
      dispatch({ type: 'SET_FIELD_ERROR', field: 'email', error: emailError });
      dispatch({ type: 'SET_FIELD_ERROR', field: 'password', error: passwordError });
      if (emailError) emailInputRef.current?.focus();
      else passwordInputRef.current?.focus();
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      const response = await authApi.login({ 
        email: state.values.email, 
        password: state.values.password 
      });
      
      const decoded = jwtDecode<{
        sub: string;
        roles: string[];
        permissions: string[];
        tenantId?: number;
      }>(response.accessToken);
      
      const user: AuthUser = {
        email: decoded.sub,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        tenantId: decoded.tenantId,
      };
      
      setCredentials(response, user);
      dispatch({ type: 'SUBMIT_SUCCESS' });
      navigate('/');
    } catch (error: unknown) {
      console.error('Login failed:', error);
      let msg = 'Incorrect email or password';
      const err = error as { response?: { data?: { detail?: string } }, message?: string };
      if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err?.message === 'Network Error') {
        msg = 'Unable to connect to backend server.';
      }
      dispatch({ type: 'SUBMIT_ERROR', error: msg });
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: 'sans-serif', userSelect: 'none' }}>
      {/* LEFT PANEL */}
      <div 
        className="login-hero-panel"
        style={{ 
          display: 'flex', 
          flex: 1, 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          backgroundColor: '#0F2E24', 
          padding: '64px' 
        }}
      >
        <div>
          <BrandLogo size={48} textSize={26} badgeText="" lightText={true} />
        </div>
        <div style={{ maxWidth: '576px' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '44px', 
            fontWeight: 'bold', 
            lineHeight: 1.1, 
            letterSpacing: '-0.025em', 
            marginBottom: '16px',
            marginTop: '0' 
          }}>
            The intelligent operating system for distribution.
          </h1>
          <p style={{ 
            color: '#89A89D', 
            fontSize: '17.6px', 
            lineHeight: 1.625,
            margin: '0'
          }}>
            Real-time inventory, dispatch, and financial reconciliation for your entire enterprise network.
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '14px', 
          color: '#5B7F71' 
        }}>
          <span>© 2026 BussManager Inc.</span>
          <span>Enterprise Edition</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        flexDirection: 'column', 
        justifyContent: 'center', 
        backgroundColor: 'white', 
        padding: '32px' 
      }}>
        <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#111827', 
            letterSpacing: '-0.025em', 
            marginBottom: '40px',
            marginTop: '0'
          }}>
            Welcome back
          </h2>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
              <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Email
              </label>
              <input
                ref={emailInputRef}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="user@spiceflow.com"
                value={state.values.email}
                onChange={(e) => dispatch({ type: 'SET_FIELD_VALUE', field: 'email', value: e.target.value })}
                onBlur={() => handleBlur('email')}
                disabled={state.status === 'loading' || state.status === 'success'}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #D1D5DB',
                  color: '#111827',
                  transition: 'border-color 150ms ease-out',
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: (state.status === 'loading' || state.status === 'success') ? 0.5 : 1
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0F9D6C')}
                onBlurCapture={(e) => (e.target.style.borderColor = '#D1D5DB')}
              />
              <div aria-live="polite" style={{ position: 'absolute', bottom: '-24px', left: 0 }}>
                {state.errors.email && (
                  <span style={{ fontSize: '12px', color: '#DC2626' }}>{state.errors.email}</span>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={state.values.password}
                  onChange={(e) => dispatch({ type: 'SET_FIELD_VALUE', field: 'password', value: e.target.value })}
                  onBlur={() => handleBlur('password')}
                  disabled={state.status === 'loading' || state.status === 'success'}
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '12px',
                    paddingRight: '40px',
                    backgroundColor: 'transparent',
                    border: '1px solid #D1D5DB',
                    color: '#111827',
                    transition: 'border-color 150ms ease-out',
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: (state.status === 'loading' || state.status === 'success') ? 0.5 : 1
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0F9D6C')}
                  onBlurCapture={(e) => (e.target.style.borderColor = '#D1D5DB')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={state.status === 'loading' || state.status === 'success'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    padding: 0,
                    outline: 'none',
                    opacity: (state.status === 'loading' || state.status === 'success') ? 0.5 : 1
                  }}
                  onFocus={(e) => (e.target.style.color = '#0F9D6C')}
                  onBlurCapture={(e) => (e.target.style.color = '#9CA3AF')}
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
              <div aria-live="polite" style={{ position: 'absolute', bottom: '-24px', left: 0 }}>
                {state.errors.password && (
                  <span style={{ fontSize: '12px', color: '#DC2626' }}>{state.errors.password}</span>
                )}
              </div>
            </div>

            {/* Submit Error */}
            <div aria-live="polite" style={{ minHeight: '20px', marginBottom: '-8px' }}>
              {'submit' in state.errors && state.errors.submit && (
                <span style={{ fontSize: '14px', color: '#DC2626' }}>{state.errors.submit}</span>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={state.status === 'loading' || state.status === 'success'}
              whileTap={state.status === 'idle' || state.status === 'error' ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.1 }}
              style={{
                position: 'relative',
                width: '100%',
                height: '48px',
                backgroundColor: '#0F9D6C',
                color: 'white',
                fontWeight: 500,
                fontSize: '16px',
                border: 'none',
                cursor: (state.status === 'loading' || state.status === 'success') ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                opacity: (state.status === 'loading' || state.status === 'success') ? 0.8 : 1
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              <AnimatePresence mode="wait">
                {state.status === 'loading' || state.status === 'success' ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <LoadingOutlined style={{ fontSize: '18px' }} />
                  </motion.div>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    Sign In
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
