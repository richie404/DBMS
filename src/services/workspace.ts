import {apiRequest} from '../lib/api';
import type {AuthUser} from '../types/auth';
export interface NotificationRecord {id:number;category:'booking'|'message'|'listing';title:string;message:string;propertyId:number|null;bookingId:number|null;conversationId:number|null;readAt:string|null;createdAt:string}
export interface Conversation {id:number;propertyId:number;disabledAt:string|null;disabledReason:string|null;updatedAt:string;title:string;location:string;monthlyRent:number;currency:string;image:string|null;participantId:number;participantName:string;participantRole:'renter'|'owner';preview:string|null;unread:number}
export interface MessageRecord {id:number;senderId:number;text:string;sentAt:string;deliveredAt:string|null;readAt:string|null}
export interface PaymentRecord {id:number;reference:string|null;bookingId:number|null;recordType:'charge'|'payout'|'refund';amount:number;currency:string;status:string;transactionAt:string|null;createdAt:string;notes:string|null;propertyId:number|null;title:string|null;location:string|null;image:string|null;payerName:string|null;payerRole:string|null;payeeName:string|null}
export interface ManagedUser extends AuthUser {createdAt:string;properties:number;bookings:number;messages:number}
export interface ActivityRecord {id:number;action:string;targetType:string|null;targetId:number|null;outcome:string;description:string|null;sourceIp:string|null;createdAt:string;actorName:string|null;actorRole:string|null}
export interface PlatformSettings {platformName:string;supportEmail:string;currency:string;timezone:string;reviewTargetHours:number;sessionTimeoutMinutes:number;maintenanceMode:boolean}
export interface SessionRecord {id:number;device:string|null;createdAt:string;lastUsedAt:string|null;expiresAt:string;current:boolean}
export interface Account {user:AuthUser & {createdAt:string;propertyCount:number};preferences:Record<string,boolean>}
export interface Summary {unreadNotifications:number;unreadMessages:number;pending:number}
export interface Overview {counts:{users:number;listings:number;pendingListings:number;activeBookings:number;activityToday:number;signedInUsers:number};items:ActivityRecord[];hourly:{hour:number;count:number}[];database:string;databaseResponseMs:number}
export interface Analytics {series:Record<'users'|'listings'|'bookings'|'revenue',{day:string;value:number}[]>;totalUsers:number;start:string;end:string}
const mutate=(path:string,method:string,body?:unknown)=>apiRequest(path,{method,body,csrf:true});
export const workspaceService={
  account:()=>apiRequest<Account>('/account'),
  updateProfile:async(body:Partial<AuthUser>)=>(await apiRequest<{user:AuthUser}>('/account',{method:'PATCH',body,csrf:true})).user,
  preferences:(body:Record<string,boolean>)=>mutate('/account/preferences','PATCH',body),
  sessions:async()=>(await apiRequest<{items:SessionRecord[]}>('/account/sessions')).items,
  revokeSession:(id:number)=>mutate(`/account/sessions/${id}`,'DELETE'),
  revokeOthers:()=>mutate('/account/sessions/revoke-others','POST'),
  notifications:async()=>(await apiRequest<{items:NotificationRecord[]}>('/notifications')).items,
  readNotification:(id:number)=>mutate(`/notifications/${id}/read`,'PATCH'),
  readAllNotifications:()=>mutate('/notifications/read-all','PATCH'),
  summary:()=>apiRequest<Summary>('/workspace/summary'),
  conversations:async()=>(await apiRequest<{items:Conversation[]}>('/conversations')).items,
  startConversation:(propertyId:number)=>apiRequest<{id:number}>('/conversations',{method:'POST',body:{propertyId},csrf:true}),
  messages:async(id:number)=>(await apiRequest<{items:MessageRecord[]}>(`/conversations/${id}/messages`)).items,
  readMessages:(id:number)=>mutate(`/conversations/${id}/read`,'PATCH'),
  sendMessage:(id:number,text:string)=>apiRequest(`/conversations/${id}/messages`,{method:'POST',body:{text},csrf:true}),
  payments:async(scope:'owner'|'admin')=>(await apiRequest<{items:PaymentRecord[]}>(`/${scope}/payments`)).items,
  users:async()=>(await apiRequest<{items:ManagedUser[]}>('/admin/users')).items,
  createAdmin:async(body:{name:string;username:string;email:string;password:string})=>(await apiRequest<{user:ManagedUser}>('/admin/users',{method:'POST',body,csrf:true})).user,
  userStatus:(id:number,status:string,reason?:string)=>mutate(`/admin/users/${id}/status`,'PATCH',{status,reason}),
  deleteUser:(id:number)=>mutate(`/admin/users/${id}`,'DELETE'),
  activity:async()=>(await apiRequest<{items:ActivityRecord[]}>('/admin/activity')).items,
  overview:()=>apiRequest<Overview>('/admin/overview'),
  analytics:(range:string)=>apiRequest<Analytics>(`/admin/analytics?range=${encodeURIComponent(range)}`),
  settings:async()=>(await apiRequest<{settings:PlatformSettings|null}>('/admin/settings')).settings,
  saveSettings:(body:Partial<PlatformSettings>)=>mutate('/admin/settings','PATCH',body),
};
export function workspaceChanged(){window.dispatchEvent(new Event('rentnest:data-changed'));}
