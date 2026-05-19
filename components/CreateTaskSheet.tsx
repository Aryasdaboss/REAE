import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { parseDate } from '../services/nlpParser';
import { buildTaskDraft, formatDueDatePreview } from '../services/createTaskHelper';
import { supabase } from '../services/supabaseClient';
import { ImportanceLevel } from '../services/rankingEngine';

// ── University of Michigan palette ────────────────────────────────────────────
const NAVY      = '#00274C';
const MAIZE     = '#FFCB05';
const WHITE     = '#FFFFFF';
const MUTED     = 'rgba(255,255,255,0.50)';
const SOFT      = 'rgba(255,255,255,0.72)';
const SURFACE   = 'rgba(255,255,255,0.07)';
const BORDER    = 'rgba(255,255,255,0.13)';
const BACKDROP  = 'rgba(0, 8, 20, 0.55)';

const IMPORTANCE_LEVELS: ImportanceLevel[] = ['Low', 'Medium', 'High', 'Critical'];
const SHEET_HEIGHT = 360;
const ANIM_DURATION = 220;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTaskSheet({ visible, onClose, onCreated }: Props) {
  const [title, setTitle]         = useState('');
  const [importance, setImportance] = useState<ImportanceLevel>('Medium');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;

  // ── Open / close animation ──────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: ANIM_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (!visible) {
        // Reset form when fully closed
        setTitle('');
        setImportance('Medium');
        setError(null);
      }
    });
  }, [visible, slide]);

  // ── Live "Due: X" preview ───────────────────────────────────────────────
  const duePreview = useMemo(() => {
    if (title.trim().length === 0) return null;
    const parsed = parseDate(title);
    return formatDueDatePreview(parsed);
  }, [title]);

  // ── Save ────────────────────────────────────────────────────────────────
  async function handleSave() {
    const draft = buildTaskDraft({ title, importance });
    if (!draft) {
      setError('Add a short title first.');
      return;
    }

    setSaving(true);
    setError(null);
    Keyboard.dismiss();

    const { error: insertError } = await supabase
      .from('tasks')
      .insert({
        title:      draft.title,
        importance: draft.importance,
        duedate:    draft.duedate,
      });

    setSaving(false);

    if (insertError) {
      setError("Couldn't save that one. Try again?");
      return;
    }

    onCreated();
    onClose();
  }

  // Don't render anything when fully closed — keeps the tree light
  // (we still mount one frame before opening so the slide-in plays)
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
    else {
      const timeout = setTimeout(() => setMounted(false), ANIM_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [visible]);
  if (!mounted) return null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: slide }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.grabber} />

        <Text style={styles.label}>New task</Text>

        <TextInput
          style={styles.titleInput}
          placeholder="What needs doing?"
          placeholderTextColor={MUTED}
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {duePreview && (
          <Text style={styles.duePreview}>Due: {duePreview}</Text>
        )}

        <Text style={styles.label}>Importance</Text>
        <View style={styles.importanceRow}>
          {IMPORTANCE_LEVELS.map(level => {
            const active = level === importance;
            return (
              <TouchableOpacity
                key={level}
                style={[styles.importanceBtn, active && styles.importanceBtnActive]}
                onPress={() => setImportance(level)}
              >
                <Text style={[styles.importanceText, active && styles.importanceTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={NAVY} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP,
  },

  sheet: {
    backgroundColor: NAVY,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    minHeight: SHEET_HEIGHT,
    borderTopWidth: 1,
    borderColor: BORDER,
  },

  grabber: {
    width: 40,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: MAIZE,
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  titleInput: {
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: WHITE,
    marginBottom: 6,
    ...Platform.select({ web: { outlineStyle: 'none' as any } }),
  },

  duePreview: {
    color: SOFT,
    fontSize: 13,
    marginLeft: 4,
    marginBottom: 16,
  },

  importanceRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  importanceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 6,
  },

  importanceBtnActive: {
    backgroundColor: MAIZE,
    borderColor: MAIZE,
  },

  importanceText: {
    color: SOFT,
    fontSize: 12,
    fontWeight: '600',
  },

  importanceTextActive: {
    color: NAVY,
    fontWeight: '700',
  },

  errorText: {
    color: SOFT,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },

  actions: {
    flexDirection: 'row',
    marginTop: 6,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    alignItems: 'center',
    marginRight: 8,
  },

  cancelText: {
    color: SOFT,
    fontWeight: '600',
    fontSize: 15,
  },

  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: MAIZE,
    borderRadius: 14,
    alignItems: 'center',
    marginLeft: 8,
  },

  saveText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
