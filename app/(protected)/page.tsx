"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTimerStore } from "@/lib/store/timerStore";
import { SubjectSelector } from "@/components/record/SubjectSelector";
import { TimerButton } from "@/components/record/TimerButton";
import { TodaySessionsList } from "@/components/record/TodaySessionsList";
import { AddSessionModal } from "@/components/record/AddSessionModal";
import { EditSessionModal } from "@/components/record/EditSessionModal";
import { StampCelebrationModal } from "@/components/stamps/StampCelebrationModal";
import { Loading } from "@/components/ui/Loading";
import { formatDuration } from "@/lib/utils/timeUtils";
import { calculateDuration } from "@/lib/utils/timeUtils";
import { getStartOfDay, getEndOfDay } from "@/lib/utils/dateUtils";
import { getDayType, getMessageForTime } from "@/lib/utils/messageUtils";
import { useTheme } from "@/lib/contexts/ThemeContext";
import type {
  StudySession,
  Subject,
  UserMessageSetting,
  SubjectEntity,
} from "@/types";
import toast from "react-hot-toast";

export default function RecordPage() {
  const supabase = createClient();
  const router = useRouter();
  const { colors } = useTheme();
  const {
    isRunning,
    currentSessionId,
    selectedSubject,
    setIsRunning,
    setCurrentSessionId,
    setSelectedSubject,
    reset,
  } = useTimerStore();

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(
    null
  );
  const [messageSettings, setMessageSettings] = useState<UserMessageSetting[]>(
    []
  );
  const [currentMessage, setCurrentMessage] = useState("今日も頑張ろう！");
  const [stampRequiredMinutes, setStampRequiredMinutes] = useState<
    number | null
  >(null);
  const [showStampCelebration, setShowStampCelebration] = useState(false);
  const [hasStampToday, setHasStampToday] = useState(false);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);

  // Supabase の認証エラー共通ハンドラ
  const handleSupabaseError = async (
    error: unknown,
    defaultMessage: string
  ) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }

    const err = error as { message?: string; code?: string };
    const message = err?.message ?? "";
    const code = err?.code;

    // リフレッシュトークンが無効な場合はログアウトしてログイン画面へ
    if (
      code === "refresh_token_not_found" ||
      message.includes("Invalid Refresh Token")
    ) {
      toast.error(
        "ログイン情報の有効期限が切れました。もう一度ログインしてください。"
      );
      await supabase.auth.signOut();
      router.push("/login");
      return;
    }

    toast.error(defaultMessage);
  };

  // ユーザーIDを取得
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          await handleSupabaseError(error, "ユーザー情報の取得に失敗しました");
          return;
        }

        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        await handleSupabaseError(error, "ユーザー情報の取得に失敗しました");
      }
    };
    getUser();
  }, [supabase, router]);

  // メッセージ設定を取得
  useEffect(() => {
    const fetchMessageSettings = async () => {
      if (!userId) return;

      try {
        const dayType = getDayType();
        const response = await fetch(
          `/api/message-settings?day_type=${dayType}`
        );

        if (response.ok) {
          const data = await response.json();
          setMessageSettings(data.settings || []);
        }
      } catch (error) {
        console.error("Failed to load message settings:", error);
      }
    };

    fetchMessageSettings();
  }, [userId]);

  // スタンプ設定を取得
  useEffect(() => {
    const fetchStampSettings = async () => {
      if (!userId) return;

      try {
        const dayType = getDayType();
        const response = await fetch("/api/stamp-settings");

        if (response.ok) {
          const data = await response.json();
          const setting = data.settings?.find(
            (s: any) => s.day_type === dayType
          );
          if (setting) {
            setStampRequiredMinutes(setting.required_minutes);
          }
        }
      } catch (error) {
        console.error("Failed to load stamp settings:", error);
      }
    };

    fetchStampSettings();
  }, [userId]);

  // 今日のスタンプ取得状況を確認
  const checkTodayStamp = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/stamps?date=${today}`);

      if (response.ok) {
        const data = await response.json();
        setHasStampToday(data.stamps && data.stamps.length > 0);
      }
    } catch (error) {
      console.error("Failed to check today stamp:", error);
    }
  };

  // ユーザーIDが取得できたらスタンプ状況を確認
  useEffect(() => {
    if (userId) {
      checkTodayStamp();
    }
  }, [userId]);

  // 教科リストを取得
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!userId) return;

      try {
        const response = await fetch("/api/subjects");

        if (response.ok) {
          const data = await response.json();
          setSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error("Failed to load subjects:", error);
      }
    };

    fetchSubjects();
  }, [userId]);

  // 合計時間が変わったらメッセージを更新
  useEffect(() => {
    if (messageSettings.length > 0) {
      const message = getMessageForTime(totalMinutes, messageSettings);
      setCurrentMessage(message);
    }
  }, [totalMinutes, messageSettings]);

  // 当日のセッションを取得
  const fetchTodaySessions = async (): Promise<number | null> => {
    if (!userId) return null;

    const today = new Date();
    const startOfToday = getStartOfDay(today);
    const endOfToday = getEndOfDay(today);

    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", startOfToday.toISOString())
        .lte("start_time", endOfToday.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        await handleSupabaseError(error, "データの取得に失敗しました");
        return null;
      }

      setSessions(data || []);

      // 合計時間を計算
      const total = (data || []).reduce((sum, session) => {
        return sum + (session.duration_minutes || 0);
      }, 0);
      setTotalMinutes(total);

      // 計測中のセッションがあれば復元
      const runningSession = data?.find((s) => !s.end_time);
      if (runningSession) {
        setIsRunning(true);
        setCurrentSessionId(runningSession.session_id);
        setSelectedSubject(runningSession.subject);
      }

      return total;
    } catch (error) {
      await handleSupabaseError(error, "データの取得に失敗しました");
      return null;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTodaySessions();
    }
  }, [userId]);

  // タイマー開始
  const handleStart = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: userId,
          subject: selectedSubject,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        await handleSupabaseError(error, "開始に失敗しました");
        return;
      }

      setIsRunning(true);
      setCurrentSessionId(data.session_id);
      toast.success("計測を開始しました");
      fetchTodaySessions();
    } catch (error) {
      await handleSupabaseError(error, "開始に失敗しました");
    }
  };

  // スタンプ獲得チェックと登録
  const checkAndAwardStamp = async (newTotalMinutes: number) => {
    // 既にスタンプを取得済み、または基準時間が設定されていない場合はスキップ
    if (hasStampToday || stampRequiredMinutes === null) return;

    // 基準時間を超えていればスタンプを付与
    if (newTotalMinutes >= stampRequiredMinutes) {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch("/api/stamps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            earned_date: today,
            total_minutes: newTotalMinutes,
          }),
        });

        if (response.ok) {
          setHasStampToday(true);
          setShowStampCelebration(true);
        }
      } catch (error) {
        console.error("Failed to award stamp:", error);
      }
    }
  };

  // タイマー停止
  const handleStop = async () => {
    if (!currentSessionId) return;

    try {
      const endTime = new Date();
      const session = sessions.find((s) => s.session_id === currentSessionId);
      if (!session) return;

      const duration = calculateDuration(session.start_time, endTime);

      const { error } = await supabase
        .from("study_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: duration,
        })
        .eq("session_id", currentSessionId);

      if (error) {
        await handleSupabaseError(error, "停止に失敗しました");
        return;
      }

      toast.success(`${formatDuration(duration)}を記録しました`);
      reset();
      const newTotal = await fetchTodaySessions();

      // 新しい合計時間でスタンプ獲得チェック
      if (newTotal !== null) {
        await checkAndAwardStamp(newTotal);
      }
    } catch (error) {
      await handleSupabaseError(error, "停止に失敗しました");
    }
  };

  // 手動追加
  const handleAddSession = async (data: {
    date: string;
    subject: Subject;
    startTime: string;
    endTime: string;
  }) => {
    if (!userId) return;

    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);
    const duration = calculateDuration(startDateTime, endDateTime);

    const { error } = await supabase.from("study_sessions").insert({
      user_id: userId,
      subject: data.subject,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration_minutes: duration,
    });

    if (error) {
      toast.error("追加に失敗しました");
      throw error;
    }

    toast.success("セッションを追加しました");

    // 今日のセッションの場合のみスタンプ獲得チェック
    const today = new Date().toISOString().split("T")[0];
    if (data.date === today) {
      const newTotal = await fetchTodaySessions();
      if (newTotal !== null) {
        await checkAndAwardStamp(newTotal);
      }
    } else {
      fetchTodaySessions();
    }
  };

  // 編集
  const handleEditSession = async (data: {
    sessionId: string;
    date: string;
    subject: Subject;
    startTime: string;
    endTime: string;
  }) => {
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);
    const duration = calculateDuration(startDateTime, endDateTime);

    const { error } = await supabase
      .from("study_sessions")
      .update({
        subject: data.subject,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: duration,
      })
      .eq("session_id", data.sessionId);

    if (error) {
      toast.error("更新に失敗しました");
      throw error;
    }

    toast.success("セッションを更新しました");

    // 今日のセッションの場合のみスタンプ獲得チェック
    const today = new Date().toISOString().split("T")[0];
    if (data.date === today) {
      const newTotal = await fetchTodaySessions();
      if (newTotal !== null) {
        await checkAndAwardStamp(newTotal);
      }
    } else {
      fetchTodaySessions();
    }
  };

  // 削除
  const handleDeleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("study_sessions")
      .delete()
      .eq("session_id", sessionId);

    if (error) {
      toast.error("削除に失敗しました");
      console.error(error);
      return;
    }

    toast.success("セッションを削除しました");
    fetchTodaySessions();
  };

  // 編集モーダルを開く
  const handleOpenEdit = (session: StudySession) => {
    setEditingSession(session);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 当日の合計時間 */}
      <div
        className="text-white rounded-lg p-6 shadow-lg text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <h2 className="text-sm font-medium mb-2">合計時間</h2>
        <p className="text-4xl font-bold">{formatDuration(totalMinutes)}</p>
        <p className="text-xl mt-3 font-medium">{currentMessage}</p>
      </div>

      {/* タイマーセクション */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          {/* 教科選択 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              教科を選択
            </h3>
            <SubjectSelector
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSelectSubject={(subjectName: string) => setSelectedSubject(subjectName as Subject)}
              disabled={isRunning}
            />
          </div>

          {/* タイマーボタン */}
          <div className="flex justify-center pt-4">
            <TimerButton
              isRunning={isRunning}
              onStart={handleStart}
              onStop={handleStop}
            />
          </div>
        </div>
      </div>

      {/* 当日の記録リスト */}
      <TodaySessionsList
        sessions={sessions}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteSession}
        onAddManual={() => setIsAddModalOpen(true)}
      />

      {/* モーダル */}
      <AddSessionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSession}
      />

      <EditSessionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSession(null);
        }}
        session={editingSession}
        onSubmit={handleEditSession}
      />

      <StampCelebrationModal
        isOpen={showStampCelebration}
        onClose={() => setShowStampCelebration(false)}
      />
    </div>
  );
}
