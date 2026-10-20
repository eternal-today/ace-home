import React, { useEffect, useState } from 'react';
import { Gift, History, Home, KeyRound, Loader2, Lock, Minus, Plus, RefreshCw, Smartphone, Star, Ticket, Undo2 } from 'lucide-react';
import {
  Coupon, cancelCoupon, couponState, coupons, daysLeft, giveStars, hubPinProblem, mathWishCoupons, setHubPin, spendHistory,
  useCoupon, useMathWish, useWallet,
} from '../ace/wallet';
import {
  AceSyncStatus, checkAceServer, clearAceSyncSettings, getAceSyncSettings, getAceSyncStatus,
  onAceSyncStatus, runAceSync, setAceSyncSettings,
} from '../ace/aceSync';
import { shortDate, toast } from '../ui';
import { geminiKeySource, maskKey, setHubGeminiKey } from '../ace/settings';

function Section({ icon, title, children, right }: { icon: React.ReactNode; title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-900 font-bold">{icon}<h3>{title}</h3></div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function Parent({ onHome }: { onHome: () => void }) {
  const w = useWallet();
  const all = coupons();
  const active = all.filter(c => couponState(c) === 'active');
  const wishes = mathWishCoupons();
  const history = spendHistory(40);

  const [sync, setSync] = useState<AceSyncStatus>(() => getAceSyncStatus());
  useEffect(() => onAceSyncStatus(setSync), []);
  const cfg = getAceSyncSettings();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [keyVer, setKeyVer] = useState(0);
  const keySrc = geminiKeySource();
  void keyVer;
  const [giftAmount, setGiftAmount] = useState(5);
  const [giftNote, setGiftNote] = useState('');
  const give = (sign: 1 | -1) => {
    const n = sign * Math.abs(giftAmount);
    if (!n) { toast('별 개수를 정해 주세요'); return; }
    if (sign < 0 && w.balance + n < 0) { toast(`남은 별(${w.balance}개)보다 많이 뺄 수 없어요`); return; }
    const msg = sign > 0 ? `별 ${giftAmount}개를 줄까요?` : `별 ${giftAmount}개를 뺄까요?`;
    if (!window.confirm(`${msg}${giftNote.trim() ? `\n이유: ${giftNote.trim()}` : ''}`)) return;
    if (giveStars(n, giftNote)) { toast(sign > 0 ? `별 ${giftAmount}개를 줬어요` : `별 ${giftAmount}개를 뺐어요`); setGiftNote(''); }
  };

  const markUsed = (c: Coupon) => {
    if (!window.confirm(`"${c.name}" 쿠폰을 사용한 것으로 표시할까요?`)) return;
    if (useCoupon(c.id)) toast('사용 처리했어요');
  };
  const undo = (c: Coupon) => {
    if (!window.confirm(`"${c.name}" 쿠폰을 되돌릴까요?\n별 ${c.price}개를 돌려주고, 구매 제한 횟수에서도 빠져요.`)) return;
    if (cancelCoupon(c.id)) toast(`별 ${c.price}개를 돌려줬어요`);
  };
  const connect = async () => {
    if (!/^https:\/\/script\.google\.com\//.test(url.trim())) { toast('웹 앱 URL을 확인해 주세요 (https://script.google.com/...)'); return; }
    if (!token.trim()) { toast('가족 코드를 입력해 주세요'); return; }
    setBusy(true); setConnectError('');
    try {
      await checkAceServer(url, token);
      setAceSyncSettings(url, token);
      await runAceSync();
      toast('연결했어요!');
    } catch (e: any) {
      setConnectError(e?.message || '연결에 실패했어요');
    } finally { setBusy(false); }
  };
  const syncNow = async () => {
    setBusy(true);
    try { await runAceSync(); toast('동기화했어요!'); }
    catch (e: any) { toast(e?.message || '동기화에 실패했어요'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onHome} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="에이스 홈으로"><Home size={20} className="text-slate-600" /></button>
          <h2 className="font-bold text-slate-900">에이스 홈 · 부모님</h2>
        </div>
        <div className="bg-trust-100 text-trust-700 text-[10px] font-black px-2 py-1 rounded-md tracking-wider">ADMIN</div>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <Section icon={<Star size={18} className="text-amber-400" />} title="아이의 별">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
            <div className="bg-blue-50 rounded-xl p-3"><div className="text-xl font-black text-blue-600">{w.mathEarned}</div><div className="text-[11px] font-bold text-blue-700">수학 번 별</div></div>
            <div className="bg-violet-50 rounded-xl p-3"><div className="text-xl font-black text-violet-600">{w.hanjaEarned}</div><div className="text-[11px] font-bold text-violet-700">한자 번 별</div></div>
            <div className="bg-orange-50 rounded-xl p-3"><div className="text-xl font-black text-orange-600">{w.englishEarned}</div><div className="text-[11px] font-bold text-orange-700">영어 번 별</div></div>
            <div className="bg-slate-50 rounded-xl p-3"><div className="text-xl font-black text-slate-600">{w.spent}</div><div className="text-[11px] font-bold text-slate-500">쓴 별</div></div>
            <div className="bg-amber-50 rounded-xl p-3"><div className="text-xl font-black text-amber-600">{w.balance}</div><div className="text-[11px] font-bold text-amber-700">남은 별</div></div>
          </div>
          <p className="text-xs text-slate-400">합산 번 별 {w.earned}개 · 명예의 전당 {w.hallCount}번{w.gifted !== 0 ? ` · 부모님이 준 별 ${w.gifted > 0 ? '+' : ''}${w.gifted}개` : ''} · 오늘 수학 {w.todayMath}문제, 한자 {w.todayHanja}문제, 영어 {w.todayEnglish}문제</p>
        </Section>

        <Section icon={<Gift size={18} className="text-emerald-500" />} title="별 주기 · 빼기">
          <p className="text-sm text-slate-500 leading-relaxed">
            용돈처럼 별을 주거나, 잘못된 것을 바로잡을 때 써요. 남은 별에만 더하거나 빼고, 축하·명예의 전당·뱃지(공부로 번 별)에는 들어가지 않아요.
          </p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-4 py-3" aria-label="1 줄이기" onClick={() => setGiftAmount(n => Math.max(1, n - 1))}><Minus size={16} /></button>
            <input type="number" inputMode="numeric" min={1} max={300} className="input-field bg-slate-50 text-center font-black text-lg max-w-24"
              value={giftAmount} onChange={e => setGiftAmount(Math.max(0, Math.min(300, parseInt(e.target.value) || 0)))} />
            <button className="btn-secondary px-4 py-3" aria-label="1 늘리기" onClick={() => setGiftAmount(n => Math.min(300, n + 1))}><Plus size={16} /></button>
            <div className="flex gap-1.5 ml-1">
              {[5, 10, 30].map(n => (
                <button key={n} onClick={() => setGiftAmount(n)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border ${giftAmount === n ? 'border-trust-300 bg-trust-50 text-trust-700' : 'border-slate-200 text-slate-500'}`}>{n}</button>
              ))}
            </div>
          </div>
          <input type="text" className="input-field bg-slate-50" placeholder="이유 (선택, 예: 심부름, 잘못 바꾼 찬스 돌려주기)" maxLength={40}
            value={giftNote} onChange={e => setGiftNote(e.target.value)} />
          <div className="flex gap-2">
            <button className="flex-1 py-3 rounded-2xl font-bold bg-emerald-500 text-white active:scale-95 transition-transform" onClick={() => give(1)}>별 주기</button>
            <button className="flex-1 py-3 rounded-2xl font-bold border-2 border-slate-200 text-slate-500 active:scale-95 transition-transform" onClick={() => give(-1)}>별 빼기</button>
          </div>
          <p className="text-[11px] text-slate-400">잘못 바꾼 찬스는 아래 "쓰지 않은 쿠폰"에서 되돌리기를 누르면 별이 그대로 돌아와요. 이미 사용 처리한 쿠폰이라면 여기서 별을 주면 돼요.</p>
        </Section>

        <Section icon={<Ticket size={18} className="text-trust-600" />} title={`쓰지 않은 쿠폰 ${active.length + wishes.length}장`}>
          {active.length === 0 && wishes.length === 0 && <p className="text-sm text-slate-400">쓰지 않은 쿠폰이 없어요.</p>}
          <div className="space-y-2">
            {active.map(c => {
              const left = daysLeft(c);
              return (
                <div key={c.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800">{c.name} <span className="text-slate-400 font-medium">· 별 {c.price}</span></div>
                    <div className="text-[11px] text-slate-400">{shortDate(c.boughtAt)}에 바꿈{left !== null ? ` · ${left}일 남음` : ''}{c.tier === 'legacy' ? ' · 예전 한자 가게' : ''}</div>
                  </div>
                  <button onClick={() => undo(c)} className="shrink-0 text-xs font-bold text-slate-400 px-2 py-2 flex items-center gap-1"><Undo2 size={13} />되돌리기</button>
                  <button onClick={() => markUsed(c)} className="shrink-0 text-xs font-bold bg-amber-500 text-white px-3 py-2 rounded-lg">사용 완료</button>
                </div>
              );
            })}
            {wishes.map(v => (
              <div key={`w${v}`} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <div className="text-2xl">🎁</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800">소원 쿠폰</div>
                  <div className="text-[11px] text-slate-400">수학 별 {v}개 달성 쿠폰 (예전 규칙)</div>
                </div>
                <button onClick={() => { if (window.confirm('소원 쿠폰을 사용한 것으로 표시할까요?')) { useMathWish(v); toast('사용 처리했어요'); } }}
                  className="shrink-0 text-xs font-bold bg-amber-500 text-white px-3 py-2 rounded-lg">사용 완료</button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">되돌리기는 잘못 누른 경우에 써요. 별을 돌려주고 주·월 구매 제한 횟수에서도 빠져요.</p>
        </Section>

        <Section icon={<History size={18} className="text-trust-600" />} title="별 내역 (쓴 별 · 준 별)">
          {history.length === 0 ? <p className="text-sm text-slate-400">아직 내역이 없어요.</p> : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {history.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className={`font-medium truncate ${r.refunded ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{r.label}</span>
                  <span className="shrink-0 ml-3 flex items-center gap-2">
                    <span className="text-[11px] text-slate-300">{shortDate(r.at)}</span>
                    <span className={`font-bold ${r.refunded ? 'text-slate-300' : r.gift && r.amount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{r.refunded ? '돌려줌' : r.gift ? (r.amount > 0 ? `+${r.amount}` : `−${-r.amount}`) : `−${r.amount}`}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={<RefreshCw size={18} className={`text-trust-600 ${sync.state === 'syncing' ? 'animate-spin' : ''}`} />} title="기기 동기화"
          right={<span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${sync.state === 'off' ? 'bg-slate-100 text-slate-400' : sync.state === 'error' ? 'bg-rose-50 text-rose-500' : sync.state === 'syncing' ? 'bg-trust-50 text-trust-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {sync.state === 'off' ? '연결 안 됨' : sync.state === 'error' ? '오류' : sync.state === 'syncing' ? '동기화 중' : '연결됨'}
          </span>}>
          {!cfg ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 leading-relaxed">
                이 기기의 수학 에이스에 동기화가 연결되어 있으면 자동으로 함께 써요. 수학 에이스를 쓰지 않는 기기라면 여기에 수학 에이스와 같은 웹 앱 URL과 가족 코드를 넣어 주세요.
              </p>
              <input type="url" className="input-field bg-slate-50" placeholder="웹 앱 URL (https://script.google.com/macros/s/.../exec)" value={url} onChange={e => setUrl(e.target.value)} />
              <input type="text" className="input-field bg-slate-50" placeholder="가족 코드" autoCapitalize="off" autoCorrect="off" value={token} onChange={e => setToken(e.target.value)} />
              <button className="btn-secondary w-full disabled:opacity-50" disabled={busy} onClick={connect}>{busy ? <Loader2 size={16} className="animate-spin inline" /> : '연결하기'}</button>
              {connectError && <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3 break-all">{connectError}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-slate-500">
                {cfg.fromMath ? '수학 에이스의 연결 정보를 함께 쓰고 있어요.' : '에이스 홈에서 직접 연결했어요.'}<br />
                마지막 동기화: <strong className="text-slate-700">{sync.lastAt ? new Date(sync.lastAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</strong>
                {sync.pending > 0 && <span className="ml-2 text-amber-600">· 보낼 것 {sync.pending}건</span>}
              </div>
              {sync.state === 'error' && sync.error && <p className="text-xs text-rose-500">{sync.error}</p>}
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50" disabled={busy} onClick={syncNow}>
                  <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />지금 동기화
                </button>
                {!cfg.fromMath && <button className="btn-secondary px-4 text-slate-400" onClick={() => { if (window.confirm('이 기기의 연결을 해제할까요?')) clearAceSyncSettings(); }}>연결 해제</button>}
              </div>
            </div>
          )}
        </Section>

        <Section icon={<KeyRound size={18} className="text-trust-600" />} title="AI 키 (Gemini) · 모든 에이스 공통">
          <p className="text-sm text-slate-500 leading-relaxed">
            여기에 한 번 넣으면 모든 에이스가 함께 써요. 동기화 서버로 가족 코드로 잠가서 보내기 때문에, 한 기기에서 넣으면 다른 기기에도 적용돼요.
          </p>
          <div className="text-sm bg-slate-50 rounded-xl p-3 text-slate-600">
            지금 쓰는 키: {keySrc.key
              ? <><strong className="font-mono">{maskKey(keySrc.key)}</strong> <span className="text-slate-400">({keySrc.from === 'hub' ? '에이스 홈에 넣은 키' : keySrc.from === 'math' ? '수학 에이스에 넣어 둔 키' : '한자 에이스에 넣어 둔 키'})</span></>
              : <span className="text-rose-500 font-bold">없음 (AI 기능이 꺼져 있어요)</span>}
          </div>
          <div className="flex gap-2">
            <input type="password" className="input-field flex-1 bg-slate-50" placeholder="AIza..." autoComplete="off"
              value={keyInput} onChange={e => setKeyInput(e.target.value)} />
            <button className="btn-secondary px-6" onClick={() => {
              if (!keyInput.trim()) { toast('키를 입력해 주세요'); return; }
              setHubGeminiKey(keyInput); setKeyInput(''); setKeyVer(v => v + 1); toast('모든 에이스에 키를 넣었어요');
            }}>저장</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keySrc.from && keySrc.from !== 'hub' && (
              <button className="text-xs font-bold text-trust-600 px-3 py-2 rounded-lg border border-trust-200 bg-trust-50" onClick={() => {
                setHubGeminiKey(keySrc.key); setKeyVer(v => v + 1); toast('이 키를 모든 에이스에서 함께 써요');
              }}>지금 키를 에이스 홈 키로 쓰기</button>
            )}
            {keySrc.from === 'hub' && (
              <button className="text-xs font-bold text-slate-400 px-3 py-2" onClick={() => {
                if (!window.confirm('에이스 홈 키를 지울까요? 각 앱에 따로 넣어 둔 키가 있으면 그 키를 써요.')) return;
                setHubGeminiKey(''); setKeyVer(v => v + 1); toast('에이스 홈 키를 지웠어요');
              }}>에이스 홈 키 지우기</button>
            )}
          </div>
        </Section>

        <Section icon={<Lock size={18} className="text-slate-400" />} title="에이스 홈 PIN">
          <div className="flex gap-2">
            <input type="password" inputMode="numeric" maxLength={4} className="input-field flex-1 bg-slate-50" placeholder="새 PIN 4자리"
              value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
            <button className="btn-secondary px-6" onClick={() => {
              const problem = hubPinProblem(newPin);
              if (problem) { toast(problem); return; }
              setHubPin(newPin); setNewPin(''); toast('PIN을 바꿨어요');
            }}>변경</button>
          </div>
          <p className="text-[11px] text-slate-400">별과 쿠폰을 다루는 곳이라 수학·한자·영어 에이스 PIN과 다른 번호를 써요. 한 기기에서 바꾸면 다른 기기에도 적용돼요.</p>
        </Section>

        <Section icon={<Smartphone size={18} className="text-slate-400" />} title="홈 화면에 추가하기">
          <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-trust-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"><Plus size={20} /></div>
            <div className="text-[11px] text-slate-500 leading-snug flex items-center">
              아이 태블릿에서 에이스 홈을 홈 화면에 추가해 두면 여기서 수학·한자·영어로 바로 갈 수 있어요.<br />
              아이폰: 공유 버튼 → 홈 화면에 추가 · 안드로이드: 메뉴 → 홈 화면에 추가
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
