import type { FormEvent } from "react";
import { X } from "lucide-react";

interface AuthViewProps {
  authMode: "login" | "signup";
  email: string;
  password: string;
  authLoading: boolean;
  authNotice: string | null;
  errorMessage: string | null;
  showSignupGuide: boolean;
  authModeQueryKey: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSwitchMode: () => void;
  onCloseSignupGuide: () => void;
  onOpenSignupInNewWindow: () => void;
  onUseSignupInCurrentWindow: () => void;
}

export function AuthView({
  authMode,
  email,
  password,
  authLoading,
  authNotice,
  errorMessage,
  showSignupGuide,
  authModeQueryKey,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSwitchMode,
  onCloseSignupGuide,
  onOpenSignupInNewWindow,
  onUseSignupInCurrentWindow
}: AuthViewProps) {
  return (
    <main className="auth-shell" data-auth-mode-query-key={authModeQueryKey}>
      <section className="auth-layout">
        <aside className="auth-showcase">
          <div className="auth-showcase-mark" aria-hidden>
            <img src="/logo-mark.svg" alt="" />
          </div>
          <p className="auth-showcase-kicker">LINKPOCKET</p>
          <h1>
            <span>읽을거리 아카이브를</span>
            <span>더 선명하게</span>
          </h1>
          <p className="auth-showcase-desc">저장부터 요약, 분류, 재탐색까지 하나의 화면에서 일관되게 관리하는 개인 지식 파이프라인.</p>
          <div className="auth-showcase-metrics">
            <article>
              <strong>Save Fast</strong>
              <span>URL / 파일 업로드 즉시 정리</span>
            </article>
            <article>
              <strong>Think Clear</strong>
              <span>AI 요약 + 키워드 + 카테고리 보강</span>
            </article>
            <article>
              <strong>Find Again</strong>
              <span>상태/태그/컬렉션 필터로 재탐색</span>
            </article>
          </div>
          <ul className="auth-showcase-list">
            <li>
              <strong>수집 속도 최적화</strong>
              <span>여러 소스의 기사를 한 번에 모아도 흐름이 끊기지 않습니다.</span>
            </li>
            <li>
              <strong>핵심 정보 중심 요약</strong>
              <span>중요 수치와 맥락을 놓치지 않도록 요약 품질을 커스터마이징할 수 있습니다.</span>
            </li>
            <li>
              <strong>다시 찾기 쉬운 구조</strong>
              <span>읽기 상태와 태그를 기준으로 필요한 자료를 빠르게 복원합니다.</span>
            </li>
          </ul>
        </aside>

        <section className="auth-card">
          <div className="auth-head">
            <p className="auth-mode-chip">{authMode === "login" ? "LOGIN" : "SIGN UP"}</p>
            <h2>{authMode === "login" ? "로그인" : "회원가입"}</h2>
            <p>{authMode === "login" ? "저장한 아카이브를 이어서 관리하세요." : "새 계정을 만들고 바로 시작하세요."}</p>
          </div>

          <form onSubmit={onSubmit} className="stack auth-form">
            <label>
              이메일
              <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required placeholder="you@example.com" />
            </label>

            <label>
              비밀번호
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                required
                placeholder="6자 이상"
              />
            </label>

            <button type="submit" disabled={authLoading}>
              {authLoading ? "처리 중..." : authMode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>

          <div className="auth-switch-row">
            <span>{authMode === "login" ? "처음이신가요?" : "이미 계정이 있나요?"}</span>
            <button type="button" className="ghost" onClick={onSwitchMode}>
              {authMode === "login" ? "회원가입으로 전환" : "로그인으로 전환"}
            </button>
          </div>

          {authNotice && <p className="ok-text">{authNotice}</p>}
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </section>
      </section>

      {showSignupGuide && (
        <div className="signup-guide-overlay" role="presentation" onClick={onCloseSignupGuide}>
          <section className="signup-guide-modal" role="dialog" aria-modal="true" aria-label="회원가입 안내" onClick={(event) => event.stopPropagation()}>
            <div className="signup-guide-head">
              <h3>회원가입 안내</h3>
              <button type="button" className="icon-btn" onClick={onCloseSignupGuide} aria-label="닫기">
                <X size={16} aria-hidden />
              </button>
            </div>
            <p className="muted">회원가입은 새 창 또는 현재 창에서 진행할 수 있습니다.</p>
            <ol className="signup-guide-steps">
              <li>회원가입을 완료합니다.</li>
              <li>이메일 인증 메일에서 인증을 완료합니다.</li>
              <li>인증 후 현재 로그인 화면에서 로그인합니다.</li>
            </ol>
            <div className="signup-guide-actions">
              <button type="button" className="ghost" onClick={onOpenSignupInNewWindow}>
                새 창에서 가입
              </button>
              <button type="button" onClick={onUseSignupInCurrentWindow}>
                현재 창에서 가입
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
