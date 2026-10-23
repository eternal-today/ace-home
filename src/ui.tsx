import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Delete, Lock, X } from 'lucide-react';
import { hubPin, hubPinProblem, setHubPin, subjectPins } from './ace/wallet';

// ── 어디서든 부를 수 있는 알림·PIN 확인 (한자 에이스와 같은 방식) ──
type ToastFn = (msg: string) => void;
type PinFn = (purpose: string, action: () => void) => void;
let toastImpl: ToastFn = () => { };
let pinImpl: PinFn = () => { };
export const toast: ToastFn = msg => toastImpl(msg);
/** 부모님 PIN을 확인한 뒤 action 실행 */
export const askPin: PinFn = (purpose, action) => pinImpl(purpose, action);

export function fireConfetti(intensity: 'normal' | 'big' | 'epic' = 'normal') {
  const count = { normal: 80, big: 160, epic: 280 }[intensity];
  const colors = ['#6366f1', '#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
  confetti({ particleCount: count, spread: 90, origin: { y: 0.6 }, colors });
  if (intensity !== 'normal') {
    setTimeout(() => confetti({ particleCount: count / 2, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors }), 150);
    setTimeout(() => confetti({ particleCount: count / 2, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors }), 150);
  }
  if (intensity === 'epic') {
    setTimeout(() => confetti({ particleCount: 120, spread: 130, origin: { y: 0.4 }, colors, scalar: 1.3 }), 400);
  }
}

/** 손가락이 닿는 순간 반응 (키보드로 누른 경우만 onClick으로) */
export function tap(fn: () => void) {
  return {
    onPointerDown: (e: React.PointerEvent) => { if (e.pointerType === 'mouse' && e.button !== 0) return; fn(); },
    onClick: (e: React.MouseEvent) => { if (e.detail === 0) fn(); },
  };
}

/** 아래에서 올라오는 창 */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6" onClick={onClose}>
          <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 22 }}
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl">
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} aria-label="닫기"
    className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center active:scale-90"><X size={20} /></button>
);

/** 알림과 PIN 창. App에 한 번만 둠 */
export function Overlays() {
  const [msg, setMsg] = useState('');
  const [pinReq, setPinReq] = useState<{ purpose: string; action: () => void } | null>(null);
  const [buffer, setBuffer] = useState('');
  const [error, setError] = useState<string | false>(false);
  // 에이스 홈 PIN이 아직 없으면: 과목 앱 PIN으로 확인 → 새 PIN → 한 번 더
  const [stage, setStage] = useState<'enter' | 'verify' | 'new' | 'confirm'>('enter');
  const [first, setFirst] = useState('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    toastImpl = m => {
      setMsg(m);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMsg(''), 2800);
    };
    pinImpl = (purpose, action) => { setBuffer(''); setError(false); setFirst(''); setStage(hubPin() ? 'enter' : 'verify'); setPinReq({ purpose, action }); };
    return () => { if (timer) clearTimeout(timer); toastImpl = () => { }; pinImpl = () => { }; };
  }, []);

  const fail = (m: string) => {
    setError(m);
    setTimeout(() => { setBuffer(''); setError(false); }, 1200);
  };
  const done = () => {
    const action = pinReq!.action;
    setPinReq(null); setBuffer(''); setStage('enter');
    action();
  };
  const press = (n: number) => {
    if (buffer.length >= 4 || !pinReq || error) return;
    const next = buffer + n;
    setBuffer(next);
    if (next.length < 4) return;
    if (stage === 'enter') {
      if (next === hubPin()) done(); else fail('PIN 번호가 올바르지 않습니다.');
    } else if (stage === 'verify') {
      if (subjectPins().includes(next)) { setBuffer(''); setStage('new'); } else fail('PIN 번호가 올바르지 않습니다.');
    } else if (stage === 'new') {
      const problem = hubPinProblem(next);
      if (problem) fail(problem); else { setFirst(next); setBuffer(''); setStage('confirm'); }
    } else {
      if (next !== first) { setFirst(''); setStage('new'); fail('두 번 넣은 번호가 달라요. 처음부터 다시 넣어 주세요'); return; }
      setHubPin(next);
      toast('에이스 홈 PIN을 만들었어요');
      done();
    }
  };
  const title = stage === 'enter' ? '부모님 인증' : '에이스 홈 PIN 만들기';
  const guide = stage === 'enter' ? (pinReq?.purpose || 'PIN 번호 4자리를 입력하세요')
    : stage === 'verify' ? '먼저 수학·한자·영어·생각 에이스 가운데 한 곳의 PIN을 넣어 주세요'
      : stage === 'new' ? '에이스 홈에서만 쓸 새 PIN을 정해 주세요. 별과 쿠폰을 다루니 아이가 모르는 번호로 정해요'
        : '같은 번호를 한 번 더 넣어 주세요';

  return (
    <>
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[9999] max-w-[90vw] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 size={18} className="text-brand-300 shrink-0" />
            <span className="font-medium text-sm">{msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {pinReq && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs text-center shadow-2xl max-h-[96dvh] overflow-y-auto">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center"><Lock size={26} className="text-slate-400" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-1 font-display">{title}</h3>
              <p className="text-sm text-slate-400 mb-6 font-medium break-keep">{guide}</p>
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${buffer.length > i ? 'bg-trust-600 border-trust-600 scale-110' : 'border-slate-200'}`} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button key={n} className="py-3 bg-slate-50 rounded-2xl text-xl font-black text-slate-700 transition-colors active:bg-trust-100 select-none" {...tap(() => press(n))}>{n}</button>
                ))}
                <button className="py-3 flex items-center justify-center text-slate-300 hover:text-slate-500" aria-label="닫기" onClick={() => { setPinReq(null); setBuffer(''); setStage('enter'); }}><X size={24} /></button>
                <button className="py-3 bg-slate-50 rounded-2xl text-xl font-black text-slate-700 transition-colors active:bg-trust-100 select-none" {...tap(() => press(0))}>0</button>
                <button className="py-3 flex items-center justify-center text-slate-300 hover:text-slate-500" aria-label="지우기" {...tap(() => setBuffer(b => b.slice(0, -1)))}><Delete size={20} /></button>
              </div>
              {error && <div className="text-rose-500 mt-4 text-sm font-bold break-keep">{error}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** 날짜 짧게 (10월 12일) */
export const shortDate = (t: number) => new Date(t).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
/** 날짜와 요일 (10월 18일 일요일) */
export const dayLabel = (t: number) => new Date(t).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
