import { useState, useEffect, useCallback, useRef } from 'react';

// Типы
interface Problem {
  a: number;
  b: number;
  weight: number;
  correct: number;
  wrong: number;
  lastSeen: number | null;
}

type AppState = 'menu' | 'training' | 'stats';

// Утилиты
function generateAllProblems(min: number, max: number): Problem[] {
  const problems: Problem[] = [];
  for (let a = min; a <= max; a++) {
    for (let b = a; b <= max; b++) {
      problems.push({ a, b, weight: 1, correct: 0, wrong: 0, lastSeen: null });
    }
  }
  return problems;
}

function weightedRandom(problems: Problem[]): Problem {
  const totalWeight = problems.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const problem of problems) {
    random -= problem.weight;
    if (random <= 0) return problem;
  }
  return problems[problems.length - 1];
}

function loadState(): { problems: Problem[]; range: [number, number] } | null {
  try {
    const saved = localStorage.getItem('multiplication-trainer');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveState(problems: Problem[], range: [number, number]) {
  localStorage.setItem('multiplication-trainer', JSON.stringify({ problems, range }));
}

// Компоненты
function Card({ problem, answer, onChange, onCheck, feedback }: {
  problem: Problem | null;
  answer: string;
  onChange: (val: string) => void;
  onCheck: () => void;
  feedback: 'correct' | 'wrong' | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [problem]);

  if (!problem) return null;

  const bgColor = feedback === 'correct' 
    ? 'bg-green-50 border-green-400' 
    : feedback === 'wrong' 
    ? 'bg-red-50 border-red-400' 
    : 'bg-white border-gray-200';

  return (
    <div className={`rounded-2xl border-2 ${bgColor} p-8 md:p-12 shadow-lg transition-all duration-300 transform`}>
      <div className="text-center">
        <div className="text-5xl md:text-7xl font-bold text-gray-800 mb-8">
          {problem.a} × {problem.b}
        </div>
        <div className="flex items-center justify-center gap-4">
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCheck()}
            className="w-32 md:w-40 text-center text-3xl md:text-4xl font-bold border-b-4 border-indigo-400 
                       focus:border-indigo-600 outline-none bg-transparent py-2 transition-colors"
            placeholder="?"
            disabled={feedback !== null}
          />
        </div>
        {feedback === 'wrong' && (
          <div className="mt-4 text-xl md:text-2xl text-red-600 font-semibold animate-bounce">
            Ответ: {problem.a * problem.b}
          </div>
        )}
        {feedback === 'correct' && (
          <div className="mt-4 text-xl md:text-2xl text-green-600 font-semibold">
            ✓ Верно!
          </div>
        )}
      </div>
    </div>
  );
}

function StatsPanel({ problems }: { problems: Problem[] }) {
  const sorted = [...problems].sort((a, b) => {
    const aRate = a.correct + a.wrong > 0 ? a.wrong / (a.correct + a.wrong) : 0;
    const bRate = b.correct + b.wrong > 0 ? b.wrong / (b.correct + b.wrong) : 0;
    return bRate - aRate;
  });

  const maxAttempts = Math.max(...sorted.map(p => p.correct + p.wrong), 1);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">📊 Статистика</h2>
      <div className="grid gap-2">
        {sorted.map((p) => {
          const total = p.correct + p.wrong;
          const rate = total > 0 ? p.correct / total : 0;
          const barWidth = total > 0 ? (total / maxAttempts) * 100 : 0;
          const color = rate >= 0.8 ? 'bg-green-400' : rate >= 0.5 ? 'bg-yellow-400' : 'bg-red-400';
          
          return (
            <div key={`${p.a}x${p.b}`} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-gray-700">
                  {p.a} × {p.b} = {p.a * p.b}
                </span>
                <span className="text-sm text-gray-500">
                  {total > 0 ? `${Math.round(rate * 100)}%` : '—'} ({p.correct}/{total})
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              {p.weight > 1 && (
                <div className="mt-1 text-xs text-orange-500">
                  ⚡ Вес: {p.weight.toFixed(1)} — появляется чаще
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RangeSelector({ range, onChange }: { 
  range: [number, number]; 
  onChange: (r: [number, number]) => void 
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
      <label className="text-gray-600 font-medium">Диапазон:</label>
      <select 
        value={range[0]} 
        onChange={(e) => onChange([Number(e.target.value), range[1]])}
        className="border-2 border-indigo-200 rounded-lg px-3 py-2 font-bold text-indigo-700 
                   focus:border-indigo-500 outline-none"
      >
        {[2,3,4,5,6,7,8,9].map(n => (
          <option key={n} value={n}>от {n}</option>
        ))}
      </select>
      <span className="text-gray-400">до</span>
      <select 
        value={range[1]} 
        onChange={(e) => onChange([range[0], Number(e.target.value)])}
        className="border-2 border-indigo-200 rounded-lg px-3 py-2 font-bold text-indigo-700 
                   focus:border-indigo-500 outline-none"
      >
        {[2,3,4,5,6,7,8,9,10].map(n => (
          <option key={n} value={n}>до {n}</option>
        ))}
      </select>
    </div>
  );
}

function SessionStats({ correct, wrong, streak }: { correct: number; wrong: number; streak: number }) {
  return (
    <div className="flex items-center justify-center gap-6 text-lg">
      <div className="flex items-center gap-2">
        <span className="text-green-500 text-2xl">✓</span>
        <span className="font-bold text-green-700">{correct}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-red-500 text-2xl">✗</span>
        <span className="font-bold text-red-700">{wrong}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-amber-500 text-2xl">🔥</span>
        <span className="font-bold text-amber-700">{streak}</span>
      </div>
    </div>
  );
}

// Главный компонент
export default function App() {
  const saved = loadState();
  const [range, setRange] = useState<[number, number]>(saved?.range || [2, 9]);
  const [problems, setProblems] = useState<Problem[]>(() => {
    if (saved) return saved.problems;
    return generateAllProblems(2, 9);
  });
  const [appState, setAppState] = useState<AppState>('menu');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  // Сохранение состояния
  useEffect(() => {
    saveState(problems, range);
  }, [problems, range]);

  const pickNext = useCallback(() => {
    const available = problems.filter(p => {
      // Не показываем тот же пример подряд
      return !currentProblem || p.a !== currentProblem.a || p.b !== currentProblem.b;
    });
    const pool = available.length > 0 ? available : problems;
    const next = weightedRandom(pool);
    setCurrentProblem(next);
    setAnswer('');
    setFeedback(null);
  }, [problems, currentProblem]);

  const startTraining = () => {
    setAppState('training');
    setSessionCorrect(0);
    setSessionWrong(0);
    setStreak(0);
    setTotalSessions(prev => prev + 1);
    
    // Выбираем первый пример
    const next = weightedRandom(problems);
    setCurrentProblem(next);
    setAnswer('');
    setFeedback(null);
  };

  const checkAnswer = () => {
    if (!currentProblem || answer === '' || feedback !== null) return;
    
    const isCorrect = Number(answer) === currentProblem.a * currentProblem.b;
    
    setProblems(prev => prev.map(p => {
      if (p.a === currentProblem.a && p.b === currentProblem.b) {
        const newWeight = isCorrect 
          ? Math.max(1, p.weight - 0.5) 
          : Math.min(10, p.weight + 2);
        return {
          ...p,
          correct: p.correct + (isCorrect ? 1 : 0),
          wrong: p.wrong + (isCorrect ? 0 : 1),
          weight: newWeight,
          lastSeen: Date.now(),
        };
      }
      return p;
    }));

    if (isCorrect) {
      setFeedback('correct');
      setSessionCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setFeedback('wrong');
      setSessionWrong(prev => prev + 1);
      setStreak(0);
    }

    // Автоматически переходим к следующему через задержку
    setTimeout(() => {
      pickNext();
    }, isCorrect ? 800 : 2000);
  };

  const changeRange = (newRange: [number, number]) => {
    if (newRange[0] > newRange[1]) {
      newRange = [newRange[1], newRange[0]];
    }
    setRange(newRange);
    // Сохраняем существующие данные для совпадающих примеров
    const newProblems = generateAllProblems(newRange[0], newRange[1]).map(np => {
      const existing = problems.find(p => p.a === np.a && p.b === np.b);
      return existing || np;
    });
    setProblems(newProblems);
  };

  const resetProgress = () => {
    if (confirm('Сбросить весь прогресс?')) {
      const newProblems = generateAllProblems(range[0], range[1]);
      setProblems(newProblems);
      setSessionCorrect(0);
      setSessionWrong(0);
      setStreak(0);
    }
  };

  const totalProblems = problems.length;
  const masteredCount = problems.filter(p => {
    const total = p.correct + p.wrong;
    return total >= 3 && (p.correct / total) >= 0.8;
  }).length;

  // Меню
  if (appState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧮</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Таблица умножения
            </h1>
            <p className="text-gray-500 text-lg">
              Адаптивный тренажёр с карточками
            </p>
          </div>

          {/* Прогресс */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 font-medium">Освоено:</span>
              <span className="font-bold text-indigo-600">{masteredCount} / {totalProblems}</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${totalProblems > 0 ? (masteredCount / totalProblems) * 100 : 0}%` }}
              />
            </div>
            {masteredCount === totalProblems && totalProblems > 0 && (
              <div className="mt-3 text-center text-green-600 font-semibold">
                🎉 Все примеры освоены!
              </div>
            )}
          </div>

          {/* Выбор диапазона */}
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 mb-6">
            <RangeSelector range={range} onChange={changeRange} />
            <p className="text-center text-sm text-gray-400">
              {totalProblems} примеров для тренировки
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-3">
            <button
              onClick={startTraining}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 
                         text-white font-bold text-xl rounded-xl shadow-lg 
                         hover:from-indigo-600 hover:to-purple-700 
                         transform hover:scale-[1.02] transition-all duration-200
                         active:scale-95"
            >
              🚀 Начать тренировку
            </button>
            <button
              onClick={() => setAppState('stats')}
              className="w-full py-3 px-6 bg-white border-2 border-indigo-200 
                         text-indigo-700 font-bold text-lg rounded-xl
                         hover:bg-indigo-50 hover:border-indigo-300
                         transition-all duration-200"
            >
              📊 Статистика
            </button>
            <button
              onClick={resetProgress}
              className="w-full py-2 px-6 text-gray-400 hover:text-red-500 
                         text-sm transition-colors duration-200"
            >
              Сбросить прогресс
            </button>
          </div>

          {/* Подсказка */}
          <div className="mt-6 text-center text-sm text-gray-400">
            💡 Примеры, в которых вы ошибаетесь, будут появляться чаще
          </div>
        </div>
      </div>
    );
  }

  // Статистика
  if (appState === 'stats') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">📊 Статистика</h1>
            <button
              onClick={() => setAppState('menu')}
              className="px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 
                         font-bold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              ← Назад
            </button>
          </div>
          <StatsPanel problems={problems} />
        </div>
      </div>
    );
  }

  // Тренировка
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center p-4">
      {/* Верхняя панель */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setAppState('menu')}
            className="px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 
                       font-bold rounded-lg hover:bg-indigo-50 transition-colors text-sm"
          >
            ← Меню
          </button>
          <button
            onClick={() => setAppState('stats')}
            className="px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 
                       font-bold rounded-lg hover:bg-indigo-50 transition-colors text-sm"
          >
            📊
          </button>
        </div>
        <SessionStats correct={sessionCorrect} wrong={sessionWrong} streak={streak} />
      </div>

      {/* Карточка */}
      <div className="w-full max-w-lg flex-1 flex items-center justify-center">
        <Card
          problem={currentProblem}
          answer={answer}
          onChange={setAnswer}
          onCheck={checkAnswer}
          feedback={feedback}
        />
      </div>

      {/* Кнопка проверки */}
      <div className="w-full max-w-lg mt-6 mb-4">
        {feedback === null && (
          <button
            onClick={checkAnswer}
            disabled={answer === ''}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-400 to-emerald-500 
                       text-white font-bold text-xl rounded-xl shadow-lg
                       hover:from-green-500 hover:to-emerald-600
                       disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                       transform hover:scale-[1.02] transition-all duration-200
                       active:scale-95"
          >
            Проверить ✓
          </button>
        )}
      </div>

      {/* Подсказка о весе */}
      {currentProblem && currentProblem.weight > 2 && (
        <div className="text-sm text-orange-500 font-medium animate-pulse">
          ⚡ Этот пример появляется чаще из-за прошлых ошибок
        </div>
      )}
    </div>
  );
}
