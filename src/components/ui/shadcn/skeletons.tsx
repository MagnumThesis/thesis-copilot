import React from "react";
import Skeleton from "./skeleton";

// Replace MainSkeleton with a structured composition matching the provided layout
export function SidebarSkeleton() {
  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col animate-pulse">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="h-6 bg-muted rounded w-24" />
          <div className="h-8 w-8 rounded bg-muted" />
        </div>

        <div className="h-10 bg-muted rounded-md" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <div className="h-4 bg-muted rounded w-12" />
        </div>

        <div className="space-y-2">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>

      <div className="border-t border-border p-4 flex items-center justify-between">
        <div className="h-8 w-8 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded" />
      </div>
    </aside>
  );
}

export function ContentAreaSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto animate-pulse">
      <div className="border-b border-border bg-background sticky top-0 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="h-6 bg-muted rounded w-48" />
        </div>
        <div className="h-10 w-10 rounded-lg bg-muted" />
      </div>

      <div className="p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>

          <div className="h-5 bg-muted rounded w-1/3 mt-6" />

          <div className="space-y-3 ml-4">
            <div className="flex gap-3">
              <div className="h-4 w-4 bg-muted rounded flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-4 w-4 bg-muted rounded flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-4 w-4 bg-muted rounded flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/5" />
              </div>
            </div>
          </div>

          <div className="space-y-2 ml-8">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/5" />
          </div>

          <div className="space-y-2 mt-6">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>

          <div className="space-y-3 ml-4">
            <div className="flex gap-3">
              <div className="h-4 w-4 bg-muted rounded flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-4 w-4 bg-muted rounded flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatPromptSkeleton() {
  return (
    <div className="border-t border-border bg-background p-4 sm:p-6 animate-pulse">
      <div className="max-w-4xl flex gap-3">
        <div className="flex-1 h-10 bg-muted rounded-lg" />
        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-muted" />
        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function DetailContentSkeleton() {
  return (
    <div className="flex flex-col h-screen max-h-[calc(100vh-64px)] bg-background animate-pulse">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* AI Message Card */}
        <div className="flex justify-start">
          <div className="w-[70%] bg-muted rounded-2xl rounded-tl-sm p-4 space-y-2">
            <div className="h-3 bg-background rounded w-full" />
            <div className="h-3 bg-background rounded w-full" />
            <div className="h-3 bg-background rounded w-5/6" />
            <div className="h-3 bg-background rounded w-4/5" />
            <div className="h-3 bg-background rounded w-full mt-3" />
            <div className="h-3 bg-background rounded w-full" />
          </div>
        </div>

        {/* User Message Card */}
        <div className="flex justify-end">
          <div className="w-[70%] rounded-2xl rounded-tr-sm p-4 space-y-2" style={{ backgroundColor: "#FB8C00" }}>
            <div className="h-3 rounded w-full" style={{ backgroundColor: "#E67E00" }} />
            <div className="h-3 rounded w-4/5" style={{ backgroundColor: "#E67E00" }} />
          </div>
        </div>

        {/* AI Message Card */}
        <div className="flex justify-start">
          <div className="w-[70%] bg-muted rounded-2xl rounded-tl-sm p-4 space-y-2">
            <div className="h-3 bg-background rounded w-full" />
            <div className="h-3 bg-background rounded w-5/6" />
          </div>
        </div>

        {/* User Message Card */}
        <div className="flex justify-end">
          <div className="w-[70%] rounded-2xl rounded-tr-sm p-4 space-y-1" style={{ backgroundColor: "#FB8C00" }}>
            <div className="h-3 rounded w-full" style={{ backgroundColor: "#E67E00" }} />
          </div>
        </div>

        {/* AI Message Card */}
        <div className="flex justify-start">
          <div className="w-[70%] bg-muted rounded-2xl rounded-tl-sm p-4 space-y-2">
            <div className="h-3 bg-background rounded w-full" />
            <div className="h-3 bg-background rounded w-full" />
            <div className="h-3 bg-background rounded w-4/5" />
            <div className="h-3 bg-background rounded w-full mt-3" />
            <div className="h-3 bg-background rounded w-5/6" />
            <div className="h-3 bg-background rounded w-full" />
          </div>
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="border-t border-border p-6 bg-background">
        <div className="flex items-end gap-3">
          <div className="flex-1 h-10 bg-muted rounded-lg" />
          <div className="h-10 w-10 bg-muted rounded-lg" />
          <div className="h-10 w-10 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="flex gap-4">
          <div className="h-10 w-20 bg-muted rounded" />
          <div className="h-10 w-24 bg-muted rounded" />
        </div>
      </div>

      {/* Hero section skeleton */}
      <div className="px-8 py-16 grid grid-cols-2 gap-12">
        <div className="space-y-6">
          {/* Hero heading skeleton */}
          <div className="space-y-3">
            <div className="h-16 w-96 bg-muted rounded" />
            <div className="h-16 w-80 bg-muted rounded" />
            <div className="h-16 w-72 bg-muted rounded" />
          </div>

          {/* Hero description skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>

          {/* CTA buttons skeleton */}
          <div className="flex gap-4 pt-4">
            <div className="h-10 w-32 bg-muted rounded" />
            <div className="h-10 w-32 bg-muted rounded" />
          </div>
        </div>

        {/* Right side image area skeleton */}
        <div className="h-96 bg-muted rounded" />
      </div>

      {/* Features section skeleton */}
      <div className="px-8 py-16 space-y-12">
        {/* Section heading skeleton */}
        <div className="h-12 w-96 bg-muted rounded mx-auto" />

        {/* Feature cards skeleton */}
        <div className="grid grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-16 w-16 bg-muted rounded" />
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LoginPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 animate-pulse">
      {/* Back to Home link */}
      <div className="w-full max-w-md mb-8">
        <div className="h-4 w-24 bg-muted rounded"></div>
      </div>

      {/* Login form card */}
      <div className="w-full max-w-md bg-background border border-border rounded-lg p-8 shadow-sm">
        {/* Heading */}
        <div className="mb-2">
          <div className="h-8 w-32 bg-muted rounded mb-4"></div>
        </div>

        {/* Subheading */}
        <div className="mb-8">
          <div className="h-4 w-56 bg-muted rounded"></div>
        </div>

        {/* Email label */}
        <div className="mb-3">
          <div className="h-4 w-20 bg-muted rounded"></div>
        </div>

        {/* Email input */}
        <div className="mb-6">
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>

        {/* Password label */}
        <div className="mb-3">
          <div className="h-4 w-20 bg-muted rounded"></div>
        </div>

        {/* Password input */}
        <div className="mb-4">
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded"></div>
            <div className="h-4 w-20 bg-muted rounded"></div>
          </div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>

        {/* Sign In button */}
        <div className="mb-6">
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>

        {/* Sign up link */}
        <div className="text-center mb-8">
          <div className="h-4 w-56 bg-muted rounded inline-block"></div>
        </div>

        {/* Or continue with divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-muted"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="flex-1 h-px bg-muted"></div>
        </div>

        {/* Provider buttons */}
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-muted rounded"></div>
          <div className="flex-1 h-10 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  )
}

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8 animate-pulse">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-2 h-10 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-24 rounded bg-muted" />
          <div className="h-10 w-28 rounded bg-muted" />
        </div>
      </div>

      {/* User Profile Card */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-muted" />

          {/* User Info */}
          <div className="flex-1">
            <div className="mb-2 h-6 w-32 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6">
          <div className="mb-4 h-7 w-40 rounded bg-muted" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Plan */}
          <div>
            <div className="mb-2 h-4 w-16 rounded bg-muted" />
            <div className="h-6 w-24 rounded bg-muted" />
          </div>

          {/* Remaining Credits */}
          <div className="text-right">
            <div className="mb-2 h-4 w-32 rounded bg-muted" />
            <div className="h-6 w-16 rounded bg-muted" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="h-10 w-32 rounded bg-muted" />
          <div className="h-10 w-28 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

export const MainSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen bg-background">
      <SidebarSkeleton />
      <div className="flex flex-col flex-1 overflow-hidden">
        <ContentAreaSkeleton />
        <ChatPromptSkeleton />
      </div>
    </div>
  );
};

export const AuthSkeleton: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-8">
    <div className="w-full max-w-md space-y-6">
      <Skeleton className="h-12 w-2/3 mx-auto" />
      <Skeleton className="h-48 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

export const GridSkeleton: React.FC = () => (
  <div className="p-6 grid grid-cols-3 gap-4">
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-40 w-full" />
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="p-6 max-w-2xl">
    <Skeleton className="h-8 w-48 mb-4" />
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default MainSkeleton;
