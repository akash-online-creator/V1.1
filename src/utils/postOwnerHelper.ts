import { User, HelpPost } from '../types';

export interface UserProfile {
  uid?: string;
  role?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  userId?: string;
  nicNumber?: string;
  email?: string;
  id?: string;
}

export const normalizePhone = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Checks if the given user has administrator permissions.
 */
export const checkIsAdmin = (user: UserProfile | User | null | undefined): boolean => {
  if (!user) return false;
  // 1. Role එක admin නම් කෙලින්ම අවසර ලැබේ
  if (user.role === 'admin' || (user as any).isAdmin === true || (user as any).isSuperAdmin === true) return true;
  
  const uid = ((user as any).userId || (user as any).uid || '').trim().toUpperCase();
  const nic = ((user as any).nicNumber || '').trim().toUpperCase();
  const email = ((user as any).email || '').trim().toLowerCase();
  const id = ((user as any).id || '').trim();

  // 2. සාමාන්‍ය Admin හැඳුනුම් පරීක්ෂාව (පුද්ගලික NIC හෝ Email මෙහි ඇතුළත් නොවේ)
  if (uid === 'ADMIN' || nic === 'ADMIN' || id === 'usr_admin') return true;
  if (email === 'admin@sahaya.lk') return true;

  return false;
};

/**
 * Strictly checks if the given user is the original author/owner of the post.
 */
export const checkIsPostOwner = (
  user: User | UserProfile | null | undefined,
  post: HelpPost | null | undefined
): boolean => {
  if (!user || !post) return false;
  if ((user as any).isDemo) return false;

  const postUserId = post.userId ? String(post.userId).trim() : '';
  const currentUserId = (user as any).userId || (user as any).uid ? String((user as any).userId || (user as any).uid).trim() : '';
  const currentId = (user as any).id ? String((user as any).id).trim() : '';

  if (postUserId) {
    if (currentUserId && postUserId.toLowerCase() === currentUserId.toLowerCase()) {
      return true;
    }
    if (currentId && postUserId.toLowerCase() === currentId.toLowerCase()) {
      return true;
    }
    return false;
  }

  const uPhone = normalizePhone((user as any).phone || (user as any).whatsappNumber);
  const pPhone = normalizePhone(post.userPhone);
  const phoneMatch = Boolean(
    uPhone &&
    pPhone &&
    uPhone.length >= 9 &&
    pPhone.length >= 9 &&
    uPhone.slice(-9) === pPhone.slice(-9)
  );

  const uName = ((user as any)?.name || '').trim().toLowerCase();
  const pName = (post.userName || '').trim().toLowerCase();
  const nameMatch = Boolean(uName && pName && uName === pName);

  return phoneMatch && nameMatch;
};

/**
 * Checks if the user can manage (Edit / Delete / Block) the given post.
 */
export const canManagePost = (
  user: UserProfile | User | null | undefined,
  postOrOwnerId: HelpPost | string | null | undefined
): boolean => {
  if (!user || !postOrOwnerId) return false;

  if (checkIsAdmin(user)) return true;

  if (typeof postOrOwnerId === 'string') {
    const currentUserId = (user as any).userId || (user as any).uid || (user as any).id || '';
    return currentUserId.toString().trim() === postOrOwnerId.trim();
  }

  return checkIsPostOwner(user, postOrOwnerId);
};
