/**
 * 에이스 홈 (허브) — 과목 앱으로 가는 입구 + 합산 별·찬스 가게·쿠폰함·명예의 전당
 * 설계: common/hub-design.md, 규칙: common/star-chance-rules.md
 */
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Baby, ChevronRight, Star, User } from 'lucide-react';
import { Overlays, askPin } from './ui';
import { initCelebration, migrateHanjaLegacy } from './ace/wallet';
import { startAceSync } from './ace/aceSync';
import Home from './screens/Home';
import Shop from './screens/Shop';
import Coupons from './screens/Coupons';
import Parent from './screens/Parent';

// 첫 화면 그리기 전에: 한자 첫날 데이터 옮기기, 축하 목록 준비
migrateHanjaLegacy();
initCelebration();

type View = 'landing' | 'home' | 'shop' | 'coupons' | 'parent';

/** 주소 끝의 #shop, #coupons 로 바로 열기 (과목 앱의 "에이스 홈에서 바꾸기" 버튼) */
function viewFromHash(): View {
  const h = location.hash.replace('#', '');
  if (h === 'shop' || h === 'coupons') return h;
  return 'landing';
}

export default function App() {
  const [view, setView] = useState<View>(() => viewFromHash());

  useEffect(() => {
    startAceSync({ pullMath: true });
    const fallback = document.getElementById('loading-fallback');
    if (fallback) fallback.style.display = 'none';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }, []);

  // ── 기기의 뒤로가기: 가게·쿠폰함 → 아이 홈, 아이 홈·부모 화면 → 첫 화면 ──
  const cur = useRef(view);
  cur.current = view;
  const guard = useRef(false);
  useEffect(() => {
    const onPop = () => {
      guard.current = false;
      const v = cur.current;
      if (v === 'landing') return;
      history.pushState({ ace: 1 }, '');
      guard.current = true;
      if (v === 'shop' || v === 'coupons') setView('home');
      else setView('landing');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (view !== 'landing' && !guard.current) { history.pushState({ ace: 1 }, ''); guard.current = true; }
    else if (view === 'landing' && guard.current) { guard.current = false; history.back(); }
  }, [view]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 selection:bg-brand-100 selection:text-brand-900">
      <Overlays />
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-brand-50 via-white to-amber-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
              className="relative z-10 text-center max-w-sm w-full">
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 3 }} transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-700 rounded-[2rem] mx-auto mb-7 flex items-center justify-center shadow-2xl shadow-brand-300/60">
                <Star size={52} className="text-amber-300 fill-amber-300" />
              </motion.div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 leading-tight font-display">우리집 에이스</h1>
              <p className="text-slate-500 mb-10 leading-relaxed font-medium">수학 에이스, 한자 에이스를 한곳에서<br />모은 별로 찬스를 바꿔요</p>
              <div className="space-y-4">
                <motion.button whileTap={{ scale: 0.97 }}
                  className="w-full group flex items-center justify-between bg-white border-2 border-slate-200 p-5 rounded-3xl hover:border-trust-500 hover:bg-trust-50 transition-all shadow-sm"
                  onClick={() => askPin('', () => setView('parent'))}>
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-trust-100 transition-colors">
                      <User size={24} className="text-slate-600 group-hover:text-trust-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">부모님 모드</div>
                      <div className="text-xs text-slate-500">쿠폰 관리, 별 장부, 동기화</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-trust-500" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  className="w-full group flex items-center justify-between bg-gradient-to-br from-brand-500 to-brand-600 p-5 rounded-3xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-xl shadow-brand-200"
                  onClick={() => setView('home')}>
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center"><Baby size={24} className="text-white" /></div>
                    <div>
                      <div className="font-bold text-white text-lg">아이 모드</div>
                      <div className="text-xs text-white/80">공부하러 가기, 찬스 바꾸기</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/60" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {view === 'parent' && (
          <motion.div key="parent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Parent onHome={() => setView('landing')} />
          </motion.div>
        )}

        {(view === 'home' || view === 'shop' || view === 'coupons') && (
          <motion.div key="child" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-[100dvh] bg-gradient-to-b from-brand-50 to-white">
            {view === 'home' && <Home onLanding={() => setView('landing')} onShop={() => setView('shop')} onCoupons={() => setView('coupons')} />}
            {view === 'shop' && <Shop onBack={() => setView('home')} onCoupons={() => setView('coupons')} />}
            {view === 'coupons' && <Coupons onBack={() => setView('home')} onShop={() => setView('shop')} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
