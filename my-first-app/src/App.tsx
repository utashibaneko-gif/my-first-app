import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type TrainingRecord = {
  id: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
};

type MealRecord = {
  id: string;
  date: string;
  time: string;
  food: string;
  calories: number;
};

function App() {
  const [date, setDate] = useState<Value>(new Date());
  
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [records, setRecords] = useState<TrainingRecord[]>([]);

  const [mealTime, setMealTime] = useState('');
  const [mealFood, setMealFood] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);

  const [restDays, setRestDays] = useState<string[]>([]);
  
  // 🌟 新規追加：レポートモーダルの表示状態を管理
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const savedTrainingData = localStorage.getItem('training-records');
    if (savedTrainingData) setRecords(JSON.parse(savedTrainingData));
    
    const savedMealData = localStorage.getItem('meal-records');
    if (savedMealData) setMealRecords(JSON.parse(savedMealData));
    
    const savedRestData = localStorage.getItem('rest-days');
    if (savedRestData) setRestDays(JSON.parse(savedRestData));
  }, []);

  useEffect(() => { localStorage.setItem('training-records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('meal-records', JSON.stringify(mealRecords)); }, [mealRecords]);
  useEffect(() => { localStorage.setItem('rest-days', JSON.stringify(restDays)); }, [restDays]);

  const handleAddTrainingRecord = () => {
    if (!exercise || !weight || !reps || !(date instanceof Date)) return;
    const newRecord: TrainingRecord = {
      id: Date.now().toString(),
      date: date.toLocaleDateString('ja-JP'),
      exercise: exercise,
      weight: Number(weight),
      reps: Number(reps),
    };
    setRecords([...records, newRecord]);
    setExercise('');
    setWeight('');
    setReps('');
  };

  const handleAddMealRecord = () => {
    if (!mealTime || !mealFood || !mealCalories || !(date instanceof Date)) return;
    const newMeal: MealRecord = {
      id: Date.now().toString(),
      date: date.toLocaleDateString('ja-JP'),
      time: mealTime,
      food: mealFood,
      calories: Number(mealCalories),
    };
    setMealRecords([...mealRecords, newMeal]);
    setMealTime('');
    setMealFood('');
    setMealCalories('');
  };

  const handleToggleRestDay = () => {
    if (!(date instanceof Date)) return;
    const dateString = date.toLocaleDateString('ja-JP');
    if (restDays.includes(dateString)) {
      setRestDays(restDays.filter(d => d !== dateString));
    } else {
      setRestDays([...restDays, dateString]);
    }
  };

  const selectedDateStr = date instanceof Date ? date.toLocaleDateString('ja-JP') : '';
  const dailyRecords = records.filter(record => record.date === selectedDateStr);
  const dailyMeals = mealRecords.filter(meal => meal.date === selectedDateStr);
  const isRestDay = restDays.includes(selectedDateStr);

  const getTileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view !== 'month') return '';
    const dateString = date.toLocaleDateString('ja-JP');
    if (restDays.includes(dateString)) return 'rest-day';
    const hasTraining = records.some(record => record.date === dateString);
    const hasMeal = mealRecords.some(meal => meal.date === dateString);
    return (hasTraining || hasMeal) ? 'recorded-day' : '';
  };

  let maxRecord: TrainingRecord | null = null;
  if (exercise) {
    const history = records.filter(r => r.exercise === exercise);
    if (history.length > 0) {
      maxRecord = history.reduce((max, current) => {
        if (current.weight > max.weight) return current;
        if (current.weight === max.weight && current.reps > max.reps) return current;
        return max;
      });
    }
  }

  // 🌟 新規追加：レポートデータの計算ロジック（0と1の判定）
  const generateReport = () => {
    if (!(date instanceof Date)) return null;
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    let daysToEvaluate = new Date(year, month + 1, 0).getDate();
    // 当月の場合は今日までの日数を評価対象とする
    if (year === today.getFullYear() && month === today.getMonth()) {
      daysToEvaluate = today.getDate();
    }

    let successCount = 0; // 0（完了）
    let failureCount = 0; // 1（未達）
    const failureDates: string[] = [];

    for (let i = 1; i <= daysToEvaluate; i++) {
      const checkDate = new Date(year, month, i).toLocaleDateString('ja-JP');
      const hasTraining = records.some(r => r.date === checkDate);
      const isRest = restDays.includes(checkDate);

      if (hasTraining || isRest) {
        successCount++;
      } else {
        failureCount++;
        failureDates.push(`${i}日`);
      }
    }

    const rate = daysToEvaluate === 0 ? 0 : Math.round((successCount / daysToEvaluate) * 100);
    return { month: month + 1, total: daysToEvaluate, successCount, failureCount, rate, failureDates };
  };

  const report = generateReport();

  return (
    <div className="app-container">
      <h1>筋トレ＆食事トラッカー</h1>
      
      {/* 🌟 新規追加：レポート出力ボタン */}
      <button className="generate-report-btn" onClick={() => setShowReport(true)}>
        📊 統合運用ステータスレポートを出力
      </button>

      <div className="calendar-wrapper">
        <Calendar 
          onChange={setDate} 
          value={date} 
          tileClassName={getTileClassName}
        />
      </div>

      <p className="selected-date">
        選択中の日付: {selectedDateStr || '日付を選択してください'}
      </p>

      <div className="form-container">
        <h2>💪 トレーニング記録</h2>
        <div className="input-group">
          <button 
            onClick={handleToggleRestDay} 
            className={isRestDay ? "rest-button active" : "rest-button"}
          >
            {isRestDay ? "🌿 休養日を解除する" : "🛌 休養日に設定"}
          </button>
          <input 
            type="text" 
            placeholder="種目 (例: ベンチプレス)" 
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            disabled={isRestDay}
          />
          {maxRecord && !isRestDay && (
            <div className="best-record-hint">
              💡 自己ベスト: <strong>{maxRecord.weight}kg × {maxRecord.reps}回</strong> 
              <span className="best-record-date">({maxRecord.date})</span>
            </div>
          )}
          <input 
            type="number" 
            placeholder="重量 (例: 77.5)" 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={isRestDay}
          />
          <input 
            type="number" 
            placeholder="回数 (例: 10)" 
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            disabled={isRestDay}
          />
          <button onClick={handleAddTrainingRecord} disabled={isRestDay}>
            筋トレを記録
          </button>
        </div>
      </div>

      <div className="form-container">
        <h2>🍽️ 食事記録</h2>
        <div className="quick-meal-tags">
          <button onClick={() => { setMealFood('油そば'); setMealCalories('800'); }} className="quick-tag-button">🍜 油そば</button>
          <button onClick={() => { setMealFood('天下一品（※家系にあらず）'); setMealCalories('949'); }} className="quick-tag-button">🐔 天下一品</button>
          <button onClick={() => { setMealFood('スターバックス オーツミルクラテ'); setMealCalories('215'); }} className="quick-tag-button">☕️ オーツミルクラテ</button>
        </div>
        <div className="input-group">
          <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} />
          <input type="text" placeholder="食べたもの (例: 油そば)" value={mealFood} onChange={(e) => setMealFood(e.target.value)} />
          <input type="number" placeholder="カロリー (例: 800)" value={mealCalories} onChange={(e) => setMealCalories(e.target.value)} />
          <button onClick={handleAddMealRecord}>食事を記録</button>
        </div>
      </div>

      <div className="records-display">
        <h3>{selectedDateStr} の記録一覧</h3>
        {isRestDay && <div className="rest-day-notice">🌿 この日は休養日に設定されています（0：戦略的完了）</div>}
        <h4 style={{ color: '#2c3e50', marginTop: '16px' }}>💪 トレーニング</h4>
        {dailyRecords.length === 0 ? <p>この日の記録はありません（1）</p> : <ul>{dailyRecords.map((record) => <li key={record.id}><strong>{record.exercise}</strong> : {record.weight}kg × {record.reps}回</li>)}</ul>}
        <h4 style={{ color: '#2c3e50', marginTop: '24px' }}>🍽️ 食事</h4>
        {dailyMeals.length === 0 ? <p>この日の記録はありません（1）</p> : <ul>{dailyMeals.map((meal) => <li key={meal.id}><strong>{meal.time}</strong> {meal.food} : {meal.calories} kcal</li>)}</ul>}
      </div>

      {/* 🌟 新規追加：レポートモーダル（ポップアップ画面） */}
      {showReport && report && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>統合運用ステータスレポート</h2>
              <button className="close-button" onClick={() => setShowReport(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="report-month">{report.month}月の実績（今日まで: {report.total}日間）</p>
              
              <div className="score-board">
                <div className="score-item success">
                  <span className="score-label">完了 (0)</span>
                  <span className="score-value">{report.successCount}日</span>
                </div>
                <div className="score-item failure">
                  <span className="score-label">未達 (1)</span>
                  <span className="score-value">{report.failureCount}日</span>
                </div>
              </div>

              <div className="achievement-rate">
                <p>計画遂行率: <strong>{report.rate}%</strong></p>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${report.rate}%` }}></div>
                </div>
              </div>

              {report.failureDates.length > 0 && (
                <div className="failure-list">
                  <p>⚠️ エラー (1) 発生日:</p>
                  <p className="dates">{report.failureDates.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;