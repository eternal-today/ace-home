import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ChevronLeft, Clock, Star, Ticket } from 'lucide-react';
import { CHANCES, Chance, TIERS, TIER_BY_ID } from '../ace/chances';
import { BuyCheck, buyChance, purchaseCheck, useWallet } from '../ace/wallet';
import { dayLabel, fireConfetti, toast } from '../ui';

const LIMIT_TEXT: Record<string, string> = {
  light: '산 날부터 7일 안에 써요',
  mid: '일주일(일~토)에 1개',
  big: '한 달에 1개',
  special: '별을 모아 바꿔요',
};

function blockedText(chk: BuyCheck): string {
  if (chk.ok) return '';
  if (chk.reason === 'stars') return `${chk.need}개 더`;
  if (chk.reason === 'week') return '다음 주에';
  return '다음 달에';
}

export default function Shop({ onBack, onCoupons }: { onBack: () => void; onCoupons: () => void }) {
  const w = useWallet();
  const [buying, setBuying] = useState<Chance | null>(null);

  const tap = (c: Chance) => {
    const chk = purchaseCheck(c, Date.now(), w);
    if (chk.ok) { setBuying(c); return; }
    if (chk.reason === 'stars') toast(`별 ${chk.need}개를 더 모으면 바꿀 수 있어요`);
    else toast(`${TIER_BY_ID[c.tier].name}는 ${dayLabel(chk.until || Date.now())}부터 다시 바꿀 수 있어요`);
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto p-5 pb-28">
      <div className="max-w-lg landscape:max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="뒤로"
            className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-500"><ChevronLeft size={22} /></button>
          <h2 className="text-2xl font-black text-slate-900 font-display flex-1">찬스 가게</h2>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            <span className="font-black text-slate-700 text-lg font-display">{w.balance}</span>
          </div>
        </div>

        <div className="space-y-6 landscape:grid landscape:grid-cols-2 landscape:gap-6 landscape:space-y-0 landscape:items-start">
          {TIERS.map(t => (
            <section key={t.id} className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 flex-wrap">
                {t.name}
                <span className="flex items-center gap-0.5 text-xs font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"><Star size={11} className="fill-amber-500 text-amber-500" />{t.price}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400"><Clock size={11} />{LIMIT_TEXT[t.id]}</span>
              </h4>
              <div className="grid sm:grid-cols-2 landscape:grid-cols-1 xl:landscape:grid-cols-2 gap-2">
                {CHANCES.filter(c => c.tier === t.id).map(c => {
                  const chk = purchaseCheck(c, Date.now(), w);
                  return (
                    <button key={c.id} onClick={() => tap(c)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${chk.ok ? 'bg-white border-amber-300 shadow-sm' : 'bg-white/60 border-slate-100'}`}>
                      <div className={`text-3xl ${chk.ok ? '' : 'grayscale opacity-60'}`}>{c.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-black text-sm ${chk.ok ? 'text-slate-800' : 'text-slate-500'}`}>{c.name}</div>
                        <div className="text-[11px] font-bold text-slate-400 break-keep">{c.desc}</div>
                      </div>
                      {chk.ok
                        ? <span className="shrink-0 text-xs font-black text-white bg-amber-500 px-2.5 py-1.5 rounded-lg">바꾸기</span>
                        : <span className="shrink-0 text-[11px] font-black text-slate-400">{blockedText(chk)}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {buying && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setBuying(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-7 max-w-xs w-full text-center shadow-2xl space-y-4">
              <div className="text-6xl">{buying.emoji}</div>
              <h3 className="text-xl font-black text-slate-900 font-display">{buying.name}</h3>
              <p className="text-sm font-bold text-slate-500 break-keep">{buying.desc}</p>
              <p className="text-sm font-black text-amber-600">별 {TIER_BY_ID[buying.tier].price}개를 쓰면 {w.balance - TIER_BY_ID[buying.tier].price}개가 남아요</p>
              {buying.tier === 'light' && <p className="text-xs font-bold text-slate-400">산 날부터 7일 안에 써야 해요</p>}
              {buying.tier === 'mid' && <p className="text-xs font-bold text-slate-400">중간 찬스는 일주일에 1개만 바꿀 수 있어요</p>}
              {buying.tier === 'big' && <p className="text-xs font-bold text-slate-400">큰 찬스는 한 달에 1개만 바꿀 수 있어요</p>}
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 py-3" onClick={() => setBuying(null)}>더 모을래</button>
                <button className="btn-primary flex-1 py-3 flex items-center justify-center gap-1" onClick={() => {
                  const ch = buying; setBuying(null);
                  const c = buyChance(ch);
                  if (c) { fireConfetti('big'); toast(`${ch.name} 쿠폰을 받았어요! 🎟️`); }
                  else toast('지금은 바꿀 수 없어요');
                }}><CheckCircle2 size={18} />바꿀래</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.95 }} onClick={onCoupons}
        className="fixed bottom-6 right-6 bg-slate-900 text-white font-black px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2">
        <Ticket size={18} />내 쿠폰 보기
      </motion.button>
    </div>
  );
}
