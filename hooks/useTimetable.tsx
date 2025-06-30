import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { UserTimetable, TimetableSlot } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface TimetableContextType {
  timetables: UserTimetable[];
  activeTimetable: UserTimetable | null;
  timetableSlots: TimetableSlot[];
  isLoading: boolean;
  error: string | null;
  createTimetable: (name: string, type: 'weekly' | 'rotating') => Promise<UserTimetable>;
  updateTimetable: (id: string, updates: Partial<UserTimetable>) => Promise<void>;
  deleteTimetable: (id: string) => Promise<void>;
  setActiveTimetable: (id: string) => Promise<void>;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id' | 'created_at'>) => Promise<void>;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  fetchTimetables: () => Promise<void>;
  getNextClass: () => { subject: string; time: string; day: string; teacher?: string; room?: string } | null;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (context === undefined) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
}

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<UserTimetable[]>([]);
  const [activeTimetable, setActiveTimetableState] = useState<UserTimetable | null>(null);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTimetables();
    }
  }, [user]);

  const fetchTimetables = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user timetables
      const { data: timetablesData, error: timetablesError } = await supabase
        .from('user_timetables')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (timetablesError) throw timetablesError;

      setTimetables(timetablesData || []);

      // Find active timetable
      const active = timetablesData?.find(t => t.is_active) || timetablesData?.[0] || null;
      setActiveTimetableState(active);

      // Fetch slots for active timetable
      if (active) {
        const { data: slotsData, error: slotsError } = await supabase
          .from('timetable_slots')
          .select('*')
          .eq('timetable_id', active.id)
          .order('day')
          .order('time_slot');

        if (slotsError) throw slotsError;
        setTimetableSlots(slotsData || []);
      }
    } catch (error: any) {
      console.error('Error fetching timetables:', error);
      setError(error.message || 'Failed to fetch timetables');
    } finally {
      setIsLoading(false);
    }
  };

  const createTimetable = async (name: string, type: 'weekly' | 'rotating'): Promise<UserTimetable> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_timetables')
        .insert({
          user_id: user.id,
          name,
          type,
          is_active: timetables.length === 0, // First timetable is active by default
        })
        .select()
        .single();

      if (error) throw error;

      setTimetables(prev => [data, ...prev]);
      if (data.is_active) {
        setActiveTimetableState(data);
      }

      return data;
    } catch (error: any) {
      console.error('Error creating timetable:', error);
      throw error;
    }
  };

  const updateTimetable = async (id: string, updates: Partial<UserTimetable>) => {
    try {
      const { error } = await supabase
        .from('user_timetables')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setTimetables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      if (activeTimetable?.id === id) {
        setActiveTimetableState(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error: any) {
      console.error('Error updating timetable:', error);
      throw error;
    }
  };

  const deleteTimetable = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_timetables')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTimetables(prev => prev.filter(t => t.id !== id));
      if (activeTimetable?.id === id) {
        const remaining = timetables.filter(t => t.id !== id);
        setActiveTimetableState(remaining[0] || null);
      }
    } catch (error: any) {
      console.error('Error deleting timetable:', error);
      throw error;
    }
  };

  const setActiveTimetable = async (id: string) => {
    try {
      // Deactivate all timetables
      await supabase
        .from('user_timetables')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      // Activate selected timetable
      const { error } = await supabase
        .from('user_timetables')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      await fetchTimetables();
    } catch (error: any) {
      console.error('Error setting active timetable:', error);
      throw error;
    }
  };

  const addTimetableSlot = async (slot: Omit<TimetableSlot, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('timetable_slots')
        .insert(slot)
        .select()
        .single();

      if (error) throw error;

      setTimetableSlots(prev => [...prev, data]);
    } catch (error: any) {
      console.error('Error adding timetable slot:', error);
      throw error;
    }
  };

  const updateTimetableSlot = async (id: string, updates: Partial<TimetableSlot>) => {
    try {
      const { error } = await supabase
        .from('timetable_slots')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setTimetableSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (error: any) {
      console.error('Error updating timetable slot:', error);
      throw error;
    }
  };

  const deleteTimetableSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('timetable_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTimetableSlots(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('Error deleting timetable slot:', error);
      throw error;
    }
  };

  const getNextClass = () => {
    if (!activeTimetable || timetableSlots.length === 0) return null;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Find today's remaining classes
    const todaySlots = timetableSlots
      .filter(slot => slot.day === currentDay)
      .filter(slot => {
        const [startTime] = slot.time_slot.split('-');
        const [hours, minutes] = startTime.split(':').map(Number);
        const slotTime = hours * 60 + minutes;
        return slotTime > currentTime;
      })
      .sort((a, b) => {
        const [aStart] = a.time_slot.split('-');
        const [bStart] = b.time_slot.split('-');
        return aStart.localeCompare(bStart);
      });

    if (todaySlots.length > 0) {
      const nextSlot = todaySlots[0];
      return {
        subject: nextSlot.subject_name,
        time: nextSlot.time_slot,
        day: currentDay,
        teacher: nextSlot.teacher_name || undefined,
        room: nextSlot.room || undefined,
      };
    }

    // If no more classes today, find tomorrow's first class
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const currentDayIndex = days.indexOf(currentDay);
    
    if (currentDayIndex !== -1) {
      for (let i = 1; i <= 5; i++) {
        const nextDayIndex = (currentDayIndex + i) % 5;
        const nextDay = days[nextDayIndex];
        
        const nextDaySlots = timetableSlots
          .filter(slot => slot.day === nextDay)
          .sort((a, b) => {
            const [aStart] = a.time_slot.split('-');
            const [bStart] = b.time_slot.split('-');
            return aStart.localeCompare(bStart);
          });

        if (nextDaySlots.length > 0) {
          const nextSlot = nextDaySlots[0];
          return {
            subject: nextSlot.subject_name,
            time: nextSlot.time_slot,
            day: nextDay,
            teacher: nextSlot.teacher_name || undefined,
            room: nextSlot.room || undefined,
          };
        }
      }
    }

    return null;
  };

  return (
    <TimetableContext.Provider
      value={{
        timetables,
        activeTimetable,
        timetableSlots,
        isLoading,
        error,
        createTimetable,
        updateTimetable,
        deleteTimetable,
        setActiveTimetable,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
        fetchTimetables,
        getNextClass,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
}