/**
 * 에이스 홈 (허브) — 과목 앱으로 가는 입구 + 합산 별·찬스 가게·쿠폰함·명예의 전당
 * 설계: common/hub-design.md, 규칙: common/star-chance-rules.md
 */
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

type View = 'home' | 'shop' | 'coupons' | 'parent';

/** 주소 끝의 #shop, #coupons 로 바로 열기 (과목 앱의 "에이스 홈에서 바꾸기" 버튼) */
function viewFromHash(): View {
  const h = location.hash.replace('#', '');
  if (h === 'shop' || h === 'coupons') return h;
  return 'home';
}

export default function App() {
  const [view, setView] = useState<View>(() => viewFromHash());

  useEffect(() => {
    startAceSync({ pullMath: true });
    const fallback = document.getElementById('loading-fallback');
    if (fallback) fallback.style.display = 'none';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }, []);

  // ── 기기의 뒤로가기: 가게·쿠폰함·부모 화면 → 홈, 홈에서는 평소처럼 나감 ──
  const cur = useRef(view);
  cur.current = view;
  const guard = useRef(false);
  useEffect(() => {
    const onPop = () => {
      guard.current = false;
      const v = cur.current;
      if (v === 'home') return;
      history.pushState({ ace: 1 }, '');
      guard.current = true;
      setView('home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (view !== 'home' && !guard.current) { history.pushState({ ace: 1 }, ''); guard.current = true; }
    else if (view === 'home' && guard.current) { guard.current = false; history.back(); }
  }, [view]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 selection:bg-brand-100 selection:text-brand-900">
      <Overlays />
      <AnimatePresence mode="wait">
        {view === 'parent' && (
          <motion.div key="parent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Parent onHome={() => setView('home')} />
          </motion.div>
        )}

        {(view === 'home' || view === 'shop' || view === 'coupons') && (
          <motion.div key="child" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-[100dvh] bg-gradient-to-b from-brand-50 to-white">
            {view === 'home' && <Home onParent={() => askPin('', () => setView('parent'))} onShop={() => setView('shop')} onCoupons={() => setView('coupons')} />}
            {view === 'shop' && <Shop onBack={() => setView('home')} onCoupons={() => setView('coupons')} />}
            {view === 'coupons' && <Coupons onBack={() => setView('home')} onShop={() => setView('shop')} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
