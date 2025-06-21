import type { Context, Next } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import type { Db } from '../db/types';
import { getUserByName } from '../repository/users';

export interface AuthUser {
  id: number;
  name: string;
}

// 認証が必要なエンドポイント用のミドルウェア
export async function requireAuth(
  c: Context<{ 
    Bindings: CloudflareBindings; 
    Variables: { db: Db; user?: AuthUser } 
  }>, 
  next: Next
) {
  try {
    // セッションクッキーからユーザー情報を取得
    const userSession = await getSignedCookie(c, c.env.SECRET, 'user_session');
    
    if (!userSession) {
      return c.json({ 
        success: false, 
        error: { 
          code: 'AUTH_REQUIRED', 
          message: 'Authentication required' 
        } 
      }, 401);
    }

    // ユーザー名でユーザー情報を取得
    const user = await getUserByName(c.var.db, userSession);
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: { 
          code: 'USER_NOT_FOUND', 
          message: 'User not found' 
        } 
      }, 401);
    }

    // ユーザー情報をコンテキストに設定
    c.set('user', { id: user.id, name: user.name });
    
    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ 
      success: false, 
      error: { 
        code: 'AUTH_ERROR', 
        message: 'Authentication failed' 
      } 
    }, 500);
  }
}

// オプショナルな認証チェック（ランキングでユーザー順位を表示する場合など）
export async function optionalAuth(
  c: Context<{ 
    Bindings: CloudflareBindings; 
    Variables: { db: Db; user?: AuthUser } 
  }>, 
  next: Next
) {
  try {
    const userSession = await getSignedCookie(c, c.env.SECRET, 'user_session');
    
    if (userSession) {
      const user = await getUserByName(c.var.db, userSession);
      if (user) {
        c.set('user', { id: user.id, name: user.name });
      }
    }
    
    await next();
  } catch (error) {
    // オプショナル認証なのでエラーは無視して続行
    console.warn('Optional auth failed:', error);
    await next();
  }
}