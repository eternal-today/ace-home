import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, Lock } from 'lucide-react';
import { Coupon, couponState, coupons, daysLeft, mathWishCoupons, useCoupon, useMathWish, useWallet } from '../ace/wallet';
import { askPin, shortDate, toast } from '../ui';

const STATE_TEXT = { used: '사용함', expired: '기간 지남', canceled: '되돌림', active: '' };

export function CouponCard({ c, onUse }: { c: Coupon; onUse?: () => void }) {
  const st = couponState(c);
  const left = daysLeft(c);
  const active = st === 'active';
  return (
    <div className={`rounded-2xl p-4 flex items-center gap-3 border-2 border-dashed ${active ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`text-3xl ${active ? '' : 'grayscale opacity-50'}`}>{c.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className={`font-black ${active ? 'text-amber-800' : 'text-slate-400'}`}>{c.name}</div>
        <div className={`text-[11px] font-bold ${active ? 'text-amber-600' : 'text-slate-400'} break-keep`}>{c.desc}</div>
        <div className="text-[11px] font-bold text-slate-400 mt-0.5">
          {shortDate(c.boughtAt)}에 바꿈
          {active && left !== null && <span className={`ml-1.5 ${left <= 2 ? 'text-rose-500' : 'text-amber-600'}`}>· {left}일 남음</span>}
          {!active && <span className="ml-1.5">· {STATE_TEXT[st]}{st === 'used' && c.usedAt ? ` (${shortDate(c.usedAt)})` : ''}</span>}
        </div>
      </div>
      {active && onUse && (
        <button onClick={onUse}
          className="shrink-0 bg-amber-500 text-white text-xs font-black px-3 py-2.5 rounded-xl active:scale-90 transition-transform flex items-center gap-1">
          <Lock size={12} />사용하기
        </button>
      )}
    </div>
  );
}

export default function Coupons({ onBack, onShop }: { onBack: () => void; onShop: () => void }) {
  useWallet();   // 쿠폰이 바뀌면 다시 그림
  const all = coupons();
  const active = all.filter(c => couponState(c) === 'active');
  const past = all.filter(c => { const s = couponState(c); return s === 'used' || s === 'expired'; }).slice(0, 20);
  const wishes = mathWishCoupons();
  const [showPast, setShowPast] = useState(false);

  const use = (c: Coupon) => askPin('쿠폰 사용은 부모님이 PIN으로 확인해요', () => {
    if (useCoupon(c.id)) toast(`${c.name}를 사용했어요! 🎉`);
    else toast('이 쿠폰은 쓸 수 없어요');
  });
  const useWish = (v: number) => askPin('쿠폰 사용은 부모님이 PIN으로 확인해요', () => {
    useMathWish(v);
    toast('소원 쿠폰을 사용했어요! 🎁');
  });

  return (
    <div className="min-h-[100dvh] overflow-y-auto p-5">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="뒤로"
            className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-500"><ChevronLeft size={22} /></button>
          <h2 className="text-2xl font-black text-slate-900 font-display">내 쿠폰</h2>
        </div>

        {active.length === 0 && wishes.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center space-y-3">
            <div className="text-4xl">🎟️</div>
            <p className="text-sm font-bold text-slate-500">쓸 수 있는 쿠폰이 없어요.<br />찬스 가게에서 별로 바꿔 보세요!</p>
            <button className="btn-primary px-6 py-3" onClick={onShop}>찬스 가게 가기</button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400">엄마·아빠에게 보여 주고, 들어주시면 부모님이 "사용하기"를 눌러요</p>
            {active.map(c => <React.Fragment key={c.id}><CouponCard c={c} onUse={() => use(c)} /></React.Fragment>)}
            {wishes.map(v => (
              <div key={`w${v}`} className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 flex items-center gap-3">
                <div className="text-3xl">🎁</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-amber-800">소원 쿠폰</div>
                  <div className="text-[11px] font-bold text-amber-600">수학 별 {v}개 달성 기념 · 소원 하나!</div>
                </div>
                <button onClick={() => useWish(v)}
                  className="shrink-0 bg-amber-500 text-white text-xs font-black px-3 py-2.5 rounded-xl active:scale-90 transition-transform flex items-center gap-1">
                  <Lock size={12} />사용하기
                </button>
              </div>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-2">
            <button onClick={() => setShowPast(v => !v)} className="w-full flex items-center justify-between text-sm font-black text-slate-500 py-2">
              지난 쿠폰 {past.length}장<ChevronDown size={18} className={`transition-transform ${showPast ? 'rotate-180' : ''}`} />
            </button>
            {showPast && past.map(c => <React.Fragment key={c.id}><CouponCard c={c} /></React.Fragment>)}
          </div>
        )}
      </div>
    </div>
  );
}
