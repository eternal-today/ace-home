import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, ChevronRight, Crown, Lock, Sparkles, Star, Ticket } from 'lucide-react';
import { TIERS } from '../ace/chances';
import { LINKS } from '../ace/links';
import { childName, couponState, coupons, mathWishCoupons, spendHistory, useWallet } from '../ace/wallet';
import { CloseButton, Sheet, shortDate } from '../ui';

interface Props { onParent: () => void; onShop: () => void; onCoupons: () => void }

export default function Home({ onParent, onShop, onCoupons }: Props) {
  const w = useWallet();
  const name = childName();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const activeCount = coupons().filter(c => couponState(c) === 'active').length + mathWishCoupons().length;
  const nextTier = TIERS.find(t => t.price > w.balance) || null;
  const nextHall = (w.hallCount + 1) * 100;

  const subjects = [
    {
      key: 'math', name: '수학 에이스', href: LINKS.math, today: w.todayMath,
      icon: <Calculator size={34} className="text-white" />,
      bg: 'from-[#3b6ef5] to-[#1d40d6]', shadow: 'shadow-blue-200',
    },
    {
      key: 'hanja', name: '한자 에이스', href: LINKS.hanja, today: w.todayHanja,
      icon: <span className="hanja text-4xl text-white">漢</span>,
      bg: 'from-[#8556f2] to-[#5b2fc9]', shadow: 'shadow-violet-200',
    },
    {
      key: 'english', name: '영어 에이스', href: LINKS.english, today: w.todayEnglish,
      icon: <span className="text-2xl font-black text-white tracking-tight">ABC</span>,
      bg: 'from-[#d9774f] to-[#a24d2e]', shadow: 'shadow-orange-200',
    },
    {
      key: 'thinking', name: '생각 에이스', href: LINKS.thinking, today: w.todayThinking,
      icon: <span className="text-3xl">🌳</span>,
      bg: 'from-[#149fa6] to-[#106870]', shadow: 'shadow-teal-200',
    },
  ];

  return (
    <div className="min-h-[100dvh] overflow-y-auto p-6">
      <header className="flex justify-between items-center mb-6 max-w-lg landscape:max-w-5xl mx-auto w-full">
        <button onClick={onParent} aria-label="부모님 모드"
          className="h-12 px-4 bg-white rounded-2xl flex items-center gap-1.5 shadow-sm border border-slate-100 text-sm font-bold text-slate-500 active:scale-95 transition-transform">
          <Lock size={16} className="text-slate-400" />부모님
        </button>
        <button onClick={() => setLedgerOpen(true)} aria-label="내 별 장부"
          className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Star size={18} className="text-amber-500 fill-amber-500" /></div>
          <span className="font-black text-slate-700 text-lg font-display">{w.balance}</span>
          <ChevronRight size={16} className="text-slate-300 -ml-1" />
        </button>
      </header>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg landscape:max-w-5xl mx-auto space-y-6 landscape:space-y-0 landscape:grid landscape:grid-cols-2 landscape:gap-8 landscape:items-start">
        {/* 왼쪽: 인사 + 과목 */}
        <div className="space-y-6">
          <div className="text-center landscape:text-left space-y-2">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-brand-400 flex justify-center landscape:justify-start">
              <Sparkles size={26} />
            </motion.div>
            <h2 className="text-3xl font-black text-slate-900 font-display">{name ? `안녕, ${name}!` : '안녕, 에이스!'}</h2>
            <p className="text-slate-500 font-medium">오늘은 무엇을 공부해 볼까?</p>
          </div>
          <div className="grid gap-4">
            {subjects.map(s => (
              <motion.a key={s.key} href={s.href} whileTap={{ scale: 0.97 }}
                className={`w-full bg-gradient-to-br ${s.bg} p-6 rounded-[2rem] shadow-xl ${s.shadow} flex items-center gap-5 text-left`}>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-black text-white">{s.name}</div>
                  <div className="text-white/80 text-sm font-bold mt-0.5">{s.today > 0 ? `오늘 ${s.today}문제 풀었어요` : '오늘 아직 안 풀었어요'}</div>
                </div>
                <ChevronRight size={28} className="text-white/70 shrink-0" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* 오른쪽: 별, 찬스, 명예의 전당 */}
        <div className="space-y-4">
          <button onClick={() => setLedgerOpen(true)}
            className="w-full bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-500">{name ? `${name}의 별` : '내 별'}</span>
              <span className="text-xs font-bold text-slate-400">지금까지 모은 별 {w.earned}개</span>
            </div>
            <div className="flex items-center gap-2 text-5xl font-black text-slate-900 font-display mt-1">
              <Star size={40} className="fill-amber-400 text-amber-400" />{w.balance}<span className="text-base text-slate-400 font-bold">개</span>
            </div>
            {nextTier ? (
              <div className="mt-3">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500">🎟️ {nextTier.name}까지</span>
                  <span className="text-amber-600">별 {nextTier.price - w.balance}개 남았어요</span>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (w.balance / nextTier.price) * 100)}%` }} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm font-black text-amber-600">✨ 특별 찬스도 바꿀 수 있어요!</p>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={onShop}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.5rem] p-5 text-left shadow-lg shadow-amber-200">
              <div className="text-3xl mb-1">🎁</div>
              <div className="text-lg font-black text-white">찬스 가게</div>
              <div className="text-xs font-bold text-white/85">별로 찬스 바꾸기</div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onCoupons}
              className="bg-white border-2 border-dashed border-amber-300 rounded-[1.5rem] p-5 text-left relative">
              <Ticket size={30} className="text-amber-500 mb-1" />
              <div className="text-lg font-black text-slate-800">내 쿠폰</div>
              <div className="text-xs font-bold text-slate-400">{activeCount > 0 ? `쓸 수 있는 쿠폰 ${activeCount}장` : '아직 없어요'}</div>
              {activeCount > 0 && <span className="absolute top-3 right-3 min-w-7 h-7 px-2 rounded-full bg-rose-500 text-white text-sm font-black flex items-center justify-center">{activeCount}</span>}
            </motion.button>
          </div>

          {w.hallCount > 0 ? (
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-[1.5rem] p-5 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="text-4xl">👑</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-lg">명예의 전당 {w.hallCount > 1 ? `${w.hallCount}번째` : ''}</div>
                  <div className="text-xs opacity-90 font-bold">모든 과목에서 별 {w.earned}개를 모은 에이스!</div>
                </div>
              </div>
              <div className="mt-3 text-xs font-bold opacity-90">다음 명예의 전당까지 별 {nextHall - w.earned}개</div>
              <div className="bg-white/20 h-2 rounded-full overflow-hidden mt-1.5">
                <div className="bg-amber-300 h-full rounded-full" style={{ width: `${((w.earned % 100) / 100) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[1.5rem] border border-slate-100 p-5">
              <div className="flex items-center gap-2 font-black text-slate-700"><Crown size={20} className="text-brand-500" />명예의 전당</div>
              <div className="flex justify-between text-xs font-bold mt-2 mb-1.5">
                <span className="text-slate-400">모든 과목에서 모은 별 100개</span>
                <span className="text-brand-600">{100 - w.earned}개 남았어요</span>
              </div>
              <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full" style={{ width: `${Math.min(100, w.earned)}%` }} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <Sheet open={ledgerOpen} onClose={() => setLedgerOpen(false)}>
        <Ledger onClose={() => setLedgerOpen(false)} />
      </Sheet>
    </div>
  );
}

/** 별 장부: 과목별 번 별, 쓴 별, 남은 별 */
export function Ledger({ onClose }: { onClose: () => void }) {
  const w = useWallet();
  const rows = spendHistory(30);
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-slate-400">별 장부</div>
          <div className="flex items-center gap-2 text-4xl font-black text-slate-900 font-display mt-1">
            <Star size={32} className="fill-amber-400 text-amber-400" />{w.balance}<span className="text-base text-slate-400 font-bold">개 남았어요</span>
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-blue-50 rounded-2xl p-3">
          <div className="text-xl font-black text-blue-600 font-display">{w.mathEarned}</div>
          <div className="text-[11px] font-bold text-blue-700">수학에서 번 별</div>
        </div>
        <div className="bg-violet-50 rounded-2xl p-3">
          <div className="text-xl font-black text-violet-600 font-display">{w.hanjaEarned}</div>
          <div className="text-[11px] font-bold text-violet-700">한자에서 번 별</div>
        </div>
        <div className="bg-orange-50 rounded-2xl p-3">
          <div className="text-xl font-black text-orange-600 font-display">{w.englishEarned}</div>
          <div className="text-[11px] font-bold text-orange-700">영어에서 번 별</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3">
          <div className="text-xl font-black text-slate-600 font-display">{w.spent}</div>
          <div className="text-[11px] font-bold text-slate-500">쓴 별</div>
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium">5문제 맞힐 때마다 별 1개. 힌트를 더 보거나 찬스로 바꾸면 줄어들어요.{w.gifted !== 0 ? ` 부모님이 준 별 ${w.gifted > 0 ? '+' : ''}${w.gifted}개가 더해져 있어요.` : ''}</p>
      {rows.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-black text-slate-800">최근 내역</h4>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className={`font-bold truncate ${r.refunded ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{r.label}</span>
                <span className="shrink-0 ml-3 flex items-center gap-2">
                  <span className="text-[11px] text-slate-300 font-bold">{shortDate(r.at)}</span>
                  <span className={`font-black ${r.refunded ? 'text-slate-300' : r.gift && r.amount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{r.refunded ? '돌려받음' : r.gift ? (r.amount > 0 ? `+${r.amount}` : `−${-r.amount}`) : `−${r.amount}`}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
