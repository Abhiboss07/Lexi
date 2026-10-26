/**
 * Lexi Automated Curriculum Validator
 * Verifies structural integrity, pedagogical quality, referential consistency,
 * exercise correctness, and search/launch mapping safety across all CEFR levels.
 */

import { LEXI_CURRICULUM } from '../data/curriculum';
import { ADVENTURE_LESSON_MAP } from '../data/lessonMapping';
import type { 
  Curriculum, 
  MultipleChoiceActivity,
  DialogueActivity,
  FillBlankActivity,
  SentenceOrderActivity,
  PronunciationPromptActivity,
  MatchingActivity,
  CEFRLevel 
} from '../types/curriculum';

export interface ValidationError {
  scope: 'level' | 'unit' | 'lesson' | 'activity' | 'mapping' | 'search';
  id: string;
  field: string;
  message: string;
}

export interface ValidationWarning {
  scope: 'level' | 'unit' | 'lesson' | 'activity' | 'mapping' | 'search';
  id: string;
  field: string;
  message: string;
}

export interface CurriculumStats {
  totalLevels: number;
  availableLevels: number;
  totalUnits: number;
  activeUnits: number;
  totalLessons: number;
  activeLessons: number;
  lessonsByLevel: Record<CEFRLevel, number>;
  activeLessonsByLevel: Record<CEFRLevel, number>;
  totalActivities: number;
  activitiesByKind: Record<string, number>;
}

export interface CurriculumValidationReport {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: CurriculumStats;
}

export class CurriculumValidator {
  /**
   * Validates the complete curriculum dataset.
   */
  static validate(curriculum: Curriculum = LEXI_CURRICULUM): CurriculumValidationReport {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const stats: CurriculumStats = {
      totalLevels: 0,
      availableLevels: 0,
      totalUnits: 0,
      activeUnits: 0,
      totalLessons: 0,
      activeLessons: 0,
      lessonsByLevel: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
      activeLessonsByLevel: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
      totalActivities: 0,
      activitiesByKind: {},
    };

    const levelCodes = Object.keys(curriculum.levels) as CEFRLevel[];
    stats.totalLevels = levelCodes.length;

    // 1. Validate CEFR Levels Metadata
    for (const code of levelCodes) {
      const meta = curriculum.levels[code];
      if (meta.status === 'available') stats.availableLevels++;

      if (!meta.descriptor || meta.descriptor.trim() === '') {
        errors.push({ scope: 'level', id: code, field: 'descriptor', message: 'CEFR level is missing communicative descriptor' });
      }
      if (!meta.listeningSpeakingGoals || meta.listeningSpeakingGoals.length === 0) {
        errors.push({ scope: 'level', id: code, field: 'listeningSpeakingGoals', message: 'No listening/speaking goals specified' });
      }
      if (!meta.grammarConcepts || meta.grammarConcepts.length === 0) {
        errors.push({ scope: 'level', id: code, field: 'grammarConcepts', message: 'No grammar concepts specified' });
      }
      // Check level prerequisites
      for (const prereq of meta.prerequisites) {
        if (!curriculum.levels[prereq]) {
          errors.push({ scope: 'level', id: code, field: 'prerequisites', message: `Prerequisite level ${prereq} does not exist` });
        }
      }
    }

    // 2. Validate Units
    const unitEntries = Object.entries(curriculum.units);
    stats.totalUnits = unitEntries.length;
    const seenUnitNumbers = new Set<number>();

    for (const [unitId, unit] of unitEntries) {
      if (unit.status === 'active' || (unit.status as string) === 'available') {
        stats.activeUnits++;
      }

      if (unit.id !== unitId) {
        errors.push({ scope: 'unit', id: unitId, field: 'id', message: `Unit key "${unitId}" does not match unit.id "${unit.id}"` });
      }
      if (!unit.title || unit.title.trim() === '') {
        errors.push({ scope: 'unit', id: unitId, field: 'title', message: 'Unit title is empty' });
      }
      if (!curriculum.levels[unit.level]) {
        errors.push({ scope: 'unit', id: unitId, field: 'level', message: `Unit references unknown CEFR level: ${unit.level}` });
      }
      if (seenUnitNumbers.has(unit.unitNumber)) {
        errors.push({ scope: 'unit', id: unitId, field: 'unitNumber', message: `Duplicate unitNumber: ${unit.unitNumber}` });
      }
      seenUnitNumbers.add(unit.unitNumber);

      if (!unit.lessonIds || unit.lessonIds.length === 0) {
        errors.push({ scope: 'unit', id: unitId, field: 'lessonIds', message: 'Unit has no associated lessons' });
      }

      // Check unit prerequisites
      for (const prereqId of unit.prerequisites) {
        if (!curriculum.units[prereqId]) {
          errors.push({ scope: 'unit', id: unitId, field: 'prerequisites', message: `Prerequisite unit "${prereqId}" does not exist in curriculum` });
        }
      }

      // Check bidirectional unit -> lesson reference
      for (const lessonId of unit.lessonIds) {
        const lesson = curriculum.lessons[lessonId];
        if (!lesson) {
          errors.push({ scope: 'unit', id: unitId, field: 'lessonIds', message: `Unit references dangling lessonId "${lessonId}"` });
        } else if (lesson.unitId !== unitId) {
          errors.push({ scope: 'unit', id: unitId, field: 'lessonIds', message: `Lesson "${lessonId}" claims unitId "${lesson.unitId}", but unit claims "${unitId}"` });
        }
      }
    }

    // 3. Validate Lessons & Activities
    const lessonEntries = Object.entries(curriculum.lessons);
    stats.totalLessons = lessonEntries.length;

    for (const [lessonId, lesson] of lessonEntries) {
      if (stats.lessonsByLevel[lesson.level] !== undefined) {
        stats.lessonsByLevel[lesson.level]++;
      }

      if (lesson.id !== lessonId) {
        errors.push({ scope: 'lesson', id: lessonId, field: 'id', message: `Lesson key "${lessonId}" does not match lesson.id "${lesson.id}"` });
      }
      if (!lesson.title || lesson.title.trim() === '') {
        errors.push({ scope: 'lesson', id: lessonId, field: 'title', message: 'Lesson title is empty' });
      }
      if (!curriculum.units[lesson.unitId]) {
        errors.push({ scope: 'lesson', id: lessonId, field: 'unitId', message: `Lesson references nonexistent unit "${lesson.unitId}"` });
      }
      if (!curriculum.levels[lesson.level]) {
        errors.push({ scope: 'lesson', id: lessonId, field: 'level', message: `Lesson references unknown CEFR level: ${lesson.level}` });
      }
      if (lesson.estimatedMinutes <= 0 || lesson.estimatedMinutes > 45) {
        warnings.push({ scope: 'lesson', id: lessonId, field: 'estimatedMinutes', message: `Unusual estimated minutes: ${lesson.estimatedMinutes}` });
      }

      // Check lesson prerequisites
      for (const prereqLessonId of lesson.prerequisites) {
        if (!curriculum.lessons[prereqLessonId]) {
          errors.push({ scope: 'lesson', id: lessonId, field: 'prerequisites', message: `Prerequisite lesson "${prereqLessonId}" not found in curriculum` });
        }
      }

      // Validate activities
      const acts = lesson.activities || [];
      if (lesson.status === 'active') {
        stats.activeLessons++;
        if (stats.activeLessonsByLevel[lesson.level] !== undefined) {
          stats.activeLessonsByLevel[lesson.level]++;
        }

        if (acts.length === 0) {
          errors.push({ scope: 'lesson', id: lessonId, field: 'activities', message: 'Active lesson has 0 activities' });
        } else if (acts.length < 2) {
          warnings.push({ scope: 'lesson', id: lessonId, field: 'activities', message: `Lesson only has ${acts.length} activity; recommend at least 2 for pedagogical variety` });
        }
      } else if (acts.length === 0) {
        warnings.push({ scope: 'lesson', id: lessonId, field: 'activities', message: `Planned lesson has 0 activities (status: ${lesson.status})` });
      }

      stats.totalActivities += acts.length;
      const seenActivityIds = new Set<string>();

      acts.forEach((act, idx) => {
        stats.activitiesByKind[act.kind] = (stats.activitiesByKind[act.kind] || 0) + 1;

        if (!act.id || act.id.trim() === '') {
          errors.push({ scope: 'activity', id: `${lessonId}[${idx}]`, field: 'id', message: 'Activity id is empty' });
        } else if (seenActivityIds.has(act.id)) {
          errors.push({ scope: 'activity', id: act.id, field: 'id', message: `Duplicate activity id within lesson: ${act.id}` });
        }
        seenActivityIds.add(act.id);

        // Activity Kind Specific Validations
        switch (act.kind) {
          case 'multiple-choice': {
            const mc = act as MultipleChoiceActivity;
            if (!mc.prompt || mc.prompt.trim() === '') {
              errors.push({ scope: 'activity', id: act.id, field: 'prompt', message: 'Multiple choice prompt is empty' });
            }
            if (!mc.options || mc.options.length < 2) {
              errors.push({ scope: 'activity', id: act.id, field: 'options', message: 'Multiple choice must have at least 2 options' });
            }
            if (typeof mc.correctIndex !== 'number' || mc.correctIndex < 0 || mc.correctIndex >= mc.options.length) {
              errors.push({ scope: 'activity', id: act.id, field: 'correctIndex', message: `correctIndex ${mc.correctIndex} out of bounds for options length ${mc.options.length}` });
            }
            if (!mc.explanation || mc.explanation.trim() === '') {
              warnings.push({ scope: 'activity', id: act.id, field: 'explanation', message: 'Multiple choice activity lacks educational explanation' });
            }
            break;
          }

          case 'dialogue': {
            const dia = act as DialogueActivity;
            if (!dia.scenarioContext || dia.scenarioContext.trim() === '') {
              warnings.push({ scope: 'activity', id: act.id, field: 'scenarioContext', message: 'Dialogue context is missing' });
            }
            if (!dia.turns || dia.turns.length < 2) {
              errors.push({ scope: 'activity', id: act.id, field: 'turns', message: 'Dialogue must have at least 2 conversation turns' });
            }
            for (let t = 0; t < dia.turns.length; t++) {
              const turn = dia.turns[t];
              if (!turn.speaker || !turn.text || turn.text.trim() === '') {
                errors.push({ scope: 'activity', id: act.id, field: `turns[${t}]`, message: 'Dialogue turn has empty speaker or text' });
              }
            }
            if (dia.comprehensionQuestion) {
              const cq = dia.comprehensionQuestion;
              if (!cq.question || !cq.options || cq.options.length < 2) {
                errors.push({ scope: 'activity', id: act.id, field: 'comprehensionQuestion', message: 'Invalid comprehension question in dialogue' });
              }
              if (typeof cq.correctIndex !== 'number' || cq.correctIndex < 0 || cq.correctIndex >= cq.options.length) {
                errors.push({ scope: 'activity', id: act.id, field: 'comprehensionQuestion.correctIndex', message: 'Dialogue question correctIndex out of bounds' });
              }
            }
            break;
          }

          case 'fill-blank': {
            const fb = act as FillBlankActivity;
            if (!fb.sentenceWithBlank || !fb.sentenceWithBlank.includes('_____')) {
              errors.push({ scope: 'activity', id: act.id, field: 'sentenceWithBlank', message: 'Fill-in-blank sentence must contain placeholder "_____"' });
            }
            if (!fb.options || fb.options.length < 2) {
              errors.push({ scope: 'activity', id: act.id, field: 'options', message: 'Fill-in-blank must provide options' });
            }
            if (!fb.correctOption || !fb.options.includes(fb.correctOption)) {
              errors.push({ scope: 'activity', id: act.id, field: 'correctOption', message: `correctOption "${fb.correctOption}" not present in options` });
            }
            break;
          }

          case 'sentence-order': {
            const so = act as SentenceOrderActivity;
            if (!so.scrambledWords || so.scrambledWords.length < 2) {
              errors.push({ scope: 'activity', id: act.id, field: 'scrambledWords', message: 'Sentence order must have at least 2 scrambled words' });
            }
            if (!so.correctSentence || so.correctSentence.trim() === '') {
              errors.push({ scope: 'activity', id: act.id, field: 'correctSentence', message: 'Sentence order correctSentence is empty' });
            }
            break;
          }

          case 'pronunciation-prompt': {
            const pr = act as PronunciationPromptActivity;
            if (!pr.targetPhrase || pr.targetPhrase.trim() === '') {
              errors.push({ scope: 'activity', id: act.id, field: 'targetPhrase', message: 'Pronunciation target phrase is empty' });
            }
            if (!pr.phoneticIpa || pr.phoneticIpa.trim() === '') {
              warnings.push({ scope: 'activity', id: act.id, field: 'phoneticIpa', message: 'Pronunciation prompt lacks phonetic IPA guide' });
            }
            break;
          }

          case 'matching': {
            const mt = act as MatchingActivity;
            if (!mt.pairs || mt.pairs.length < 2) {
              errors.push({ scope: 'activity', id: act.id, field: 'pairs', message: 'Matching activity must have at least 2 pairs' });
            }
            break;
          }
        }
      });
    }

    // 4. Validate Adventure Lesson Mappings
    for (const [advKey, mappedLessonId] of Object.entries(ADVENTURE_LESSON_MAP)) {
      const lesson = curriculum.lessons[mappedLessonId];
      if (!lesson) {
        errors.push({ scope: 'mapping', id: advKey, field: 'mappedLessonId', message: `Adventure mapped to non-existent lesson: ${mappedLessonId}` });
      } else if (!lesson.activities || lesson.activities.length === 0) {
        errors.push({ scope: 'mapping', id: advKey, field: 'mappedLessonId', message: `Adventure mapped to lesson with 0 activities: ${mappedLessonId}` });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats,
    };
  }
}
