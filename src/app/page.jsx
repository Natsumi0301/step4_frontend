// app/pos/page.jsx
"use client";

import React, { useMemo, useRef, useState } from "react";

/**
 * POS Lv1 Frontend (Next.js App Router / JSX版)
 * ----------------------------------------------
 * ・商品コード入力→読み込み→名称/単価表示→「追加」で購入リストに積む→「購入」POST
 * ・API は FastAPI 側に以下を想定
 *   - GET  /product?code=JAN13
 *     -> { prd_id:number, code:string, name:string, price:number } | null
 *   - POST /purchase
 *     body: {
 *       emp_cd:string, store_cd:string, pos_no:string,
 *       items: { prd_id:number, prd_code:string, prd_name:string, prd_price:number, qty:number }[]
 *     }
 *     -> { success:boolean, total_amount:number }
 *
 * .env.local に NEXT_PUBLIC_API_BASE_URL を設定してください（例: http://localhost:8000）。
 */

// ===== API Client =====
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchProductByCode(code) {
  const url = new URL("/product", API_BASE);
  url.searchParams.set("code", code);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`商品マスタ照会に失敗しました (${res.status})`);
  const data = await res.json();
  return data; // 見つからない場合は null を返す FastAPI 実装を想定
}

async function postPurchase(payload) {
  const res = await fetch(`${API_BASE}/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`購入APIに失敗しました (${res.status})`);
  return res.json();
}

// ===== Utility =====
const fmtJPY = (n) => new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

// ===== Main Page =====
export default function POSApp() {
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [cart, setCart] = React.useState([]);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleAdd = () => {
    if (!name || !price) return;
    const existing = cart.find((item) => item.code === code);
    if (existing) {
      existing.qty += 1;
      setCart([...cart]);
    } else {
      setCart([...cart, { code, name, price: parseInt(price, 10), qty: 1 }]);
    }
    setCode('');
    setName('');
    setPrice('');
  };

  return (
    <div className="flex justify-between rounded-2xl bg-white p-6 shadow-md">
      {/* 左側 */}
      <div className="w-1/2 space-y-3">
        {/* タイトル削除・上に詰め */}
        <label className="block font-semibold text-slate-800">コード入力エリア</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-2 text-base font-medium"
          placeholder="1234567890123"
        />
        <button className="w-full rounded-lg bg-sky-600 py-2 text-white font-semibold hover:bg-sky-700">
          商品コード 読み込み
        </button>

        {/* 名称表示と単価表示を2段表示に戻す */}
        <div>
          <label className="block text-slate-800 font-semibold">名称表示</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 text-base font-medium"
          />
        </div>
        <div>
          <label className="block text-slate-800 font-semibold">単価表示</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 text-base font-medium"
          />
        </div>

        <button
          onClick={handleAdd}
          className="w-full rounded-lg bg-emerald-400 py-2 text-white font-semibold hover:bg-emerald-500"
        >
          購入リストへ追加
        </button>
      </div>

      {/* 右側（購入リスト） */}
      <div className="w-1/2 pl-6">
        <h2 className="mb-2 text-lg font-bold text-slate-800">購入リスト</h2>
        <div className="h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-base font-medium">
          {cart.length === 0 ? (
            <div className="text-slate-400">リストは空です</div>
          ) : (
            <ul>
              {cart.map((item, i) => (
                <li key={i} className="flex justify-between border-b border-slate-200 py-1">
                  <span>{item.name}</span>
                  <span>{item.qty}</span>
                  <span>{item.price}円</span>
                  <span>{item.price * item.qty}円</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex justify-between items-center text-base font-semibold text-slate-800">
          <span>小計（参考）</span>
          <span>¥{total.toLocaleString()}</span>
        </div>

        <button className="mt-2 w-full rounded-lg bg-violet-400 py-2 text-white font-semibold hover:bg-violet-500">
          購入
        </button>
      </div>
    </div>
  );
}
