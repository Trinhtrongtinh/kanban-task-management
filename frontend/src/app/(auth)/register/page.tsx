'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/hooks/ui/use-i18n';

// Backend RegisterDto: { username, email, password }
// Frontend dùng "fullName" → map sang username khi gửi
const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên tối đa 50 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không đúng định dạng'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(50, 'Mật khẩu tối đa 50 ký tự'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const googleLoginUrl = authApi.getGoogleLoginUrl();

  useEffect(() => {
    const errorCode = new URLSearchParams(window.location.search).get('error');
    if (errorCode === 'social_auth_failed') {
      setServerError('Đăng ký bằng mạng xã hội thất bại. Vui lòng thử lại.');
    }
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const { user } = await authApi.register({
        username: values.fullName,   // map fullName → username (backend field)
        email: values.email,
        password: values.password,
      });
      login(user);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
        ?? 'Registration failed. Please try again.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <span className="text-2xl font-bold text-primary-foreground">K</span>
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.registerTitle')}</CardTitle>
        <CardDescription>{t('auth.registerDescription')}</CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fullName')}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.processing')}
                </>
              ) : (
                t('auth.register')
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <a href={googleLoginUrl}>Google</a>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
