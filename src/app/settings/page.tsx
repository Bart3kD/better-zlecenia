'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Palette
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { Profile } from '@/types/profiles.types';
import { NOTIFICATION_TYPES } from '@/types/notifications.types';

interface NotificationSettings {
  [NOTIFICATION_TYPES.NEW_MESSAGE]: boolean;
  [NOTIFICATION_TYPES.OFFER_TAKEN]: boolean;
  [NOTIFICATION_TYPES.OFFER_COMPLETED]: boolean;
  [NOTIFICATION_TYPES.OFFER_CANCELLED]: boolean;
  [NOTIFICATION_TYPES.RATING_RECEIVED]: boolean;
  [NOTIFICATION_TYPES.DEADLINE_REMINDER]: boolean;
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    bio: ''
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    [NOTIFICATION_TYPES.NEW_MESSAGE]: true,
    [NOTIFICATION_TYPES.OFFER_TAKEN]: true,
    [NOTIFICATION_TYPES.OFFER_COMPLETED]: true,
    [NOTIFICATION_TYPES.OFFER_CANCELLED]: true,
    [NOTIFICATION_TYPES.RATING_RECEIVED]: true,
    [NOTIFICATION_TYPES.DEADLINE_REMINDER]: true,
    [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: true
  });

  // Get current user profile
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUser(profile);
          setProfileForm({
            username: profile.username || '',
            bio: profile.bio || ''
          });
        }
      }
    };
    getCurrentUser();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileForm.username || null,
          bio: profileForm.bio || null,
          avatar_url: currentUser.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      alert('Profil zaktualizowany pomyślnie!');

      // Refresh user data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
      } else if (updatedProfile) {
        setCurrentUser(updatedProfile);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === '23505') {
        alert('Ta nazwa użytkownika jest już zajęta. Wybierz inną.');
      } else {
        alert('Nie udało się zaktualizować profilu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć
        </Button>
        <h1 className="text-3xl font-bold">Ustawienia</h1>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil użytkownika
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUser?.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(
                  (currentUser?.full_name ?? undefined) ||
                  (currentUser?.username ?? undefined)
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <Label htmlFor="avatar-url">Link do zdjęcia profilowego</Label>
              <Input
                id="avatar-url"
                type="text"
                value={currentUser?.avatar_url ?? ""}
                onChange={(e) =>
                  setCurrentUser((prev) =>
                    prev ? { ...prev, avatar_url: e.target.value } : prev
                  )
                }
                placeholder="https://example.com/avatar.png"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? "Zapisywanie..." : "Zapisz link"}
              </Button>
            </div>
          </div>

          {/* Profile Form - Only editable fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nazwa użytkownika</Label>
              <Input
                id="username"
                value={profileForm.username}
                onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="jankowalski"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Opis</Label>
              <textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Opowiedz coś o sobie..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Read-only information */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-900">Informacje o koncie</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Imię i nazwisko</Label>
                <div className="px-3 py-2 bg-gray-50 border rounded-md text-gray-700">
                  {currentUser?.full_name || 'Nie podano'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Klasa</Label>
                <div className="px-3 py-2 bg-gray-50 border rounded-md text-gray-700">
                  {currentUser?.grade_level ? `Klasa ${currentUser.grade_level}` : 'Nie podano'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email szkolny</Label>
                <div className="px-3 py-2 bg-gray-50 border rounded-md text-gray-700">
                  {currentUser?.school_email}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Ocena</Label>
                <div className="px-3 py-2 bg-gray-50 border rounded-md text-gray-700">
                  {currentUser?.average_rating?.toFixed(1) || '0.0'}/5
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleProfileUpdate} disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Powiadomienia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {Object.entries({
              [NOTIFICATION_TYPES.NEW_MESSAGE]: 'Nowe wiadomości',
              [NOTIFICATION_TYPES.OFFER_TAKEN]: 'Oferta została podjęta', 
              [NOTIFICATION_TYPES.OFFER_COMPLETED]: 'Oferta zakończona',
              [NOTIFICATION_TYPES.OFFER_CANCELLED]: 'Oferta anulowana',
              [NOTIFICATION_TYPES.RATING_RECEIVED]: 'Otrzymano ocenę',
              [NOTIFICATION_TYPES.DEADLINE_REMINDER]: 'Przypomnienia o terminach',
              [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: 'Ogłoszenia systemowe'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{label}</Label>
                </div>
                <Button
                  variant={notifications[key as unknown as keyof NotificationSettings] ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleNotification(key as unknown as keyof NotificationSettings)}
                >
                  {notifications[key as unknown as keyof NotificationSettings] ? "Włączone" : "Wyłączone"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Wygląd
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Motyw</Label>
              <p className="text-sm text-gray-500">
                Wybierz motyw aplikacji
              </p>
            </div>
            <Button variant="outline" size="sm">
              Jasny
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
