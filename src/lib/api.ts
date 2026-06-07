import { GSheetData, ScorePayload, TrackingPayload } from '../types';

// Use the API_URL from env or fallback to hardcoded public endpoint
const API_URL = process.env.API_URL || 'https://script.google.com/macros/s/AKfycbzrd1hFpqoRtez24NMUM4J-R8xEoNlYFWx2F_qXU06fFO8snVkFg-I49oG7RckoOec/exec';

export async function loadAll(): Promise<GSheetData> {
  if (!API_URL) {
    throw new Error('Chưa cấu hình API_URL');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const resp = await fetch(`${API_URL}?action=all`, { signal: controller.signal });
    clearTimeout(timeoutId);

    const text = await resp.text();
    let apiData;
    try {
      apiData = JSON.parse(text);
    } catch (parseErr) {
      throw new Error('API trả về dữ liệu không hợp lệ (không phải JSON)');
    }

    return apiData;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('Kết nối quá thời gian (30s). Kiểm tra mạng hoặc thử lại.');
    }
    throw e;
  }
}

export async function submitScore(payload: ScorePayload): Promise<{ success: boolean; message: string }> {
  if (!API_URL) throw new Error('Chưa cấu hình API URL');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  return await resp.json();
}

export async function submitTracking(payload: TrackingPayload): Promise<{ success: boolean; message: string }> {
  if (!API_URL) throw new Error('Chưa cấu hình API URL');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  return await resp.json();
}

export async function deleteScore(maSk: string): Promise<{ success: boolean; message: string }> {
  if (!API_URL) throw new Error('Chưa cấu hình API URL');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'deleteScore', ma_sk: maSk }),
  });
  return await resp.json();
}
