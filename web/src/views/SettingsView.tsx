type ThemeMode = "dark" | "light";
type FontScaleMode = "small" | "normal" | "large";
type SummaryLengthMode = "short" | "medium" | "long";
type SummaryStyleMode = "neutral" | "easy" | "insight";

interface SettingsViewProps {
  autoAnalyzeOnImport: boolean;
  importingFile: boolean;
  exportingFormat: string | null;
  bulkAiRunning: boolean;
  loadingLinks: boolean;
  summaryLengthMode: SummaryLengthMode;
  summaryStyleMode: SummaryStyleMode;
  summaryLengthOrder: readonly SummaryLengthMode[];
  summaryStyleOrder: readonly SummaryStyleMode[];
  summaryLengthLabel: Record<SummaryLengthMode, string>;
  summaryStyleLabel: Record<SummaryStyleMode, string>;
  summaryFocusText: string;
  summaryCustomPrompt: string;
  savingAiPreferences: boolean;
  loadingAiPreferences: boolean;
  themeMode: ThemeMode;
  fontScaleMode: FontScaleMode;
  nextPassword: string;
  nextPasswordConfirm: string;
  updatingPassword: boolean;
  deletingAll: boolean;
  deletingAccount: boolean;
  onSetAutoAnalyzeOnImport: (value: boolean) => void;
  onOpenImportFile: () => void;
  onExportLinks: (format: "jsonl" | "csv") => void;
  onRunBulkAiForUncategorized: () => void;
  onSetSummaryLengthMode: (value: SummaryLengthMode) => void;
  onSetSummaryStyleMode: (value: SummaryStyleMode) => void;
  onSetSummaryFocusText: (value: string) => void;
  onSetSummaryCustomPrompt: (value: string) => void;
  onSaveAiPreferences: () => void;
  onResetAiPreferencesDraft: () => void;
  onSetThemeMode: (value: ThemeMode) => void;
  onSetFontScaleMode: (value: FontScaleMode) => void;
  onSetNextPassword: (value: string) => void;
  onSetNextPasswordConfirm: (value: string) => void;
  onUpdatePassword: () => void;
  onDeleteAllLinks: () => void;
  onDeleteAccount: () => void;
  onOpenHelp: () => void;
}

export function SettingsView({
  autoAnalyzeOnImport,
  importingFile,
  exportingFormat,
  bulkAiRunning,
  loadingLinks,
  summaryLengthMode,
  summaryStyleMode,
  summaryLengthOrder,
  summaryStyleOrder,
  summaryLengthLabel,
  summaryStyleLabel,
  summaryFocusText,
  summaryCustomPrompt,
  savingAiPreferences,
  loadingAiPreferences,
  themeMode,
  fontScaleMode,
  nextPassword,
  nextPasswordConfirm,
  updatingPassword,
  deletingAll,
  deletingAccount,
  onSetAutoAnalyzeOnImport,
  onOpenImportFile,
  onExportLinks,
  onRunBulkAiForUncategorized,
  onSetSummaryLengthMode,
  onSetSummaryStyleMode,
  onSetSummaryFocusText,
  onSetSummaryCustomPrompt,
  onSaveAiPreferences,
  onResetAiPreferencesDraft,
  onSetThemeMode,
  onSetFontScaleMode,
  onSetNextPassword,
  onSetNextPasswordConfirm,
  onUpdatePassword,
  onDeleteAllLinks,
  onDeleteAccount,
  onOpenHelp
}: SettingsViewProps) {
  return (
    <section className="panel settings-panel">
      <div className="settings-grid">
        <article className="settings-card">
          <h3>데이터 관리</h3>
          <p className="muted">기사 가져오기/내보내기와 AI 일괄 실행을 관리합니다.</p>
          <div className="settings-control">
            <span>가져오기 후 AI 자동 분석</span>
            <div className="chip-row">
              <button type="button" className={`chip ${!autoAnalyzeOnImport ? "active" : ""}`} onClick={() => onSetAutoAnalyzeOnImport(false)}>
                끔
              </button>
              <button type="button" className={`chip ${autoAnalyzeOnImport ? "active" : ""}`} onClick={() => onSetAutoAnalyzeOnImport(true)}>
                켬
              </button>
            </div>
          </div>
          <div className="settings-actions">
            <button type="button" className="ghost" onClick={onOpenImportFile} disabled={importingFile}>
              {importingFile ? "가져오는 중..." : "파일 가져오기"}
            </button>
            <button type="button" className="ghost" onClick={() => onExportLinks("jsonl")} disabled={Boolean(exportingFormat)}>
              {exportingFormat === "jsonl" ? "JSONL 내보내는 중..." : "JSONL 내보내기"}
            </button>
            <button type="button" className="ghost" onClick={() => onExportLinks("csv")} disabled={Boolean(exportingFormat)}>
              {exportingFormat === "csv" ? "CSV 내보내는 중..." : "CSV 내보내기"}
            </button>
            <button type="button" className="ghost" onClick={onRunBulkAiForUncategorized} disabled={bulkAiRunning || loadingLinks}>
              {bulkAiRunning ? "미분류 AI 처리중..." : "미분류 전체 AI 분석"}
            </button>
          </div>
          <p className="muted">내보내기는 삭제되지 않은 링크만 포함합니다.</p>
        </article>

        <article className="settings-card">
          <h3>AI 요약 설정</h3>
          <p className="muted">원하는 내용과 분량으로 요약을 커스터마이징합니다. 저장 후 다음 AI 실행부터 적용됩니다.</p>
          <div className="settings-control">
            <span>요약 분량</span>
            <div className="chip-row">
              {summaryLengthOrder.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`chip ${summaryLengthMode === mode ? "active" : ""}`}
                  onClick={() => onSetSummaryLengthMode(mode)}
                >
                  {summaryLengthLabel[mode]}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-control">
            <span>요약 스타일</span>
            <div className="chip-row">
              {summaryStyleOrder.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`chip ${summaryStyleMode === mode ? "active" : ""}`}
                  onClick={() => onSetSummaryStyleMode(mode)}
                >
                  {summaryStyleLabel[mode]}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-form-grid">
            <label>
              원하는 내용 (핵심 포커스)
              <input
                value={summaryFocusText}
                onChange={(event) => onSetSummaryFocusText(event.target.value.slice(0, 120))}
                placeholder="예: 정책 영향, 투자 시사점, 핵심 수치 중심"
                maxLength={120}
              />
            </label>
            <label>
              커스텀 프롬프트
              <textarea
                value={summaryCustomPrompt}
                onChange={(event) => onSetSummaryCustomPrompt(event.target.value.slice(0, 500))}
                rows={4}
                placeholder="예: 근거와 수치를 우선하고, 마지막에 1줄 결론을 추가해줘."
                maxLength={500}
              />
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="ghost" onClick={onSaveAiPreferences} disabled={savingAiPreferences || loadingAiPreferences}>
              {savingAiPreferences ? "AI 설정 저장 중..." : "AI 설정 저장"}
            </button>
            <button type="button" className="ghost" onClick={onResetAiPreferencesDraft} disabled={savingAiPreferences || loadingAiPreferences}>
              기본값으로 되돌리기
            </button>
          </div>
          {loadingAiPreferences && <p className="muted">AI 요약 설정 불러오는 중...</p>}
        </article>

        <article className="settings-card">
          <h3>화면 설정</h3>
          <p className="muted">테마와 글자 크기를 즉시 변경할 수 있습니다.</p>
          <div className="settings-control">
            <span>테마</span>
            <div className="chip-row">
              <button type="button" className={`chip ${themeMode === "dark" ? "active" : ""}`} onClick={() => onSetThemeMode("dark")}>
                다크
              </button>
              <button type="button" className={`chip ${themeMode === "light" ? "active" : ""}`} onClick={() => onSetThemeMode("light")}>
                라이트
              </button>
            </div>
          </div>
          <div className="settings-control">
            <span>글자 크기</span>
            <div className="chip-row">
              <button type="button" className={`chip ${fontScaleMode === "small" ? "active" : ""}`} onClick={() => onSetFontScaleMode("small")}>
                작게
              </button>
              <button type="button" className={`chip ${fontScaleMode === "normal" ? "active" : ""}`} onClick={() => onSetFontScaleMode("normal")}>
                기본
              </button>
              <button type="button" className={`chip ${fontScaleMode === "large" ? "active" : ""}`} onClick={() => onSetFontScaleMode("large")}>
                크게
              </button>
            </div>
          </div>
        </article>

        <article className="settings-card">
          <h3>보안</h3>
          <p className="muted">비밀번호 변경과 계정 정리를 관리합니다.</p>
          <div className="settings-form-grid">
            <label>
              새 비밀번호
              <input type="password" minLength={6} value={nextPassword} onChange={(event) => onSetNextPassword(event.target.value)} placeholder="6자 이상" />
            </label>
            <label>
              새 비밀번호 확인
              <input
                type="password"
                minLength={6}
                value={nextPasswordConfirm}
                onChange={(event) => onSetNextPasswordConfirm(event.target.value)}
                placeholder="동일하게 입력"
              />
            </label>
          </div>
          <div className="settings-actions">
            <button type="button" className="ghost" onClick={onUpdatePassword} disabled={updatingPassword}>
              {updatingPassword ? "비밀번호 변경 중..." : "비밀번호 변경"}
            </button>
          </div>
          <div className="settings-control">
            <span>데이터 / 계정</span>
            <p className="muted">삭제 작업은 복구할 수 없습니다.</p>
          </div>
          <div className="settings-actions">
            <button type="button" className="danger-solid" onClick={onDeleteAllLinks} disabled={deletingAll}>
              {deletingAll ? "전체 삭제 중..." : "기사 전체 삭제"}
            </button>
            <button type="button" className="danger-solid" onClick={onDeleteAccount} disabled={deletingAccount}>
              {deletingAccount ? "회원 탈퇴 처리중..." : "회원 탈퇴"}
            </button>
          </div>
        </article>

        <article className="settings-card">
          <h3>도움말</h3>
          <p className="muted">기본 사용법만 간단하게 확인합니다.</p>
          <div className="settings-actions">
            <button type="button" className="ghost" onClick={onOpenHelp}>
              도움말 열기
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
