import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

// カレンダー用の型定義
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// 筋トレ記録の型
type TrainingRecord = {
  id: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
};

// 🌟 新規追加：食事記録のデータの形（型）を定義
type MealRecord = {
  id: string;
  date: string;
  time: string;
  food: string;
  calories: number;
};

function App() {
  const [date, setDate] = useState<Value>(new Date());
  
  // 筋トレフォームの状態
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [records, setRecords] = useState<TrainingRecord[]>([]);

  // 🌟 新規追加：食事フォームの状態
  const [mealTime, setMealTime] = useState('');
  const [mealFood, setMealFood] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);

  // 初期読み込み（筋トレ＆食事）
  useEffect(() => {
    const savedTrainingData = localStorage.getItem('training-records');
    if (savedTrainingData) {
      setRecords(JSON.parse(savedTrainingData));
    }

    const savedMealData = localStorage.getItem('meal-records');
    if (savedMealData) {
      setMealRecords(JSON.parse(savedMealData));
    }
  }, []);

  // ローカルストレージ保存（筋トレ）
  useEffect(() => {
    localStorage.setItem('training-records', JSON.stringify(records));
  }, [records]);

  // 🌟 ローカルストレージ保存（食事）
  useEffect(() => {
    localStorage.setItem('meal-records', JSON.stringify(mealRecords));
  }, [mealRecords]);

  // 筋トレ記録の追加処理
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

  // 🌟 新規追加：食事記録の追加処理
  const handleAddMealRecord = () => {
    if (!mealTime || !mealFood || !mealCalories || !(date instanceof Date)) return;

    const newMeal: MealRecord = {
      id: Date.now().toString(), // ミリ秒単位の時刻をIDに
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

  const selectedDateStr = date instanceof Date ? date.toLocaleDateString('ja-JP') : '';
  const dailyRecords = records.filter(record => record.date === selectedDateStr);
  
  // 🌟 選択中の日付の食事記録を抽出
  const dailyMeals = mealRecords.filter(meal => meal.date === selectedDateStr);

  const getTileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view !== 'month') return '';
    const dateString = date.toLocaleDateString('ja-JP');
    
    // 🌟 筋トレか食事、どちらか一方でも記録があれば色を付ける
    const hasTraining = records.some(record => record.date === dateString);
    const hasMeal = mealRecords.some(meal => meal.date === dateString);
    
    return (hasTraining || hasMeal) ? 'recorded-day' : '';
  };

  return (
    <div className="app-container">
      <h1>筋トレ＆食事トラッカー</h1>
      
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

      {/* 筋トレ入力フォーム */}
      <div className="form-container">
        <h2>💪 トレーニング記録</h2>
        <div className="input-group">
          <input 
            type="text" 
            placeholder="種目 (例: ベンチプレス)" 
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="重量 (例: 77.5)" 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="回数 (例: 10)" 
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
          <button onClick={handleAddTrainingRecord}>筋トレを記録</button>
        </div>
      </div>

      {/* 🌟 食事入力フォームを追加 */}
      <div className="form-container">
        <h2>🍽️ 食事記録</h2>
        <div className="input-group">
          <input 
            type="time" 
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="食べたもの (例: 油そば)" 
            value={mealFood}
            onChange={(e) => setMealFood(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="カロリー (例: 800)" 
            value={mealCalories}
            onChange={(e) => setMealCalories(e.target.value)}
          />
          <button onClick={handleAddMealRecord}>食事を記録</button>
        </div>
      </div>

      {/* 記録一覧エリア */}
      <div className="records-display">
        <h3>{selectedDateStr} の記録一覧</h3>
        
        <h4 style={{ color: '#2c3e50', marginTop: '16px' }}>💪 トレーニング</h4>
        {dailyRecords.length === 0 ? (
          <p>この日の記録はありません（1）</p>
        ) : (
          <ul>
            {dailyRecords.map((record) => (
              <li key={record.id}>
                <strong>{record.exercise}</strong> : {record.weight}kg × {record.reps}回
              </li>
            ))}
          </ul>
        )}

        {/* 🌟 食事記録の表示エリアを追加 */}
        <h4 style={{ color: '#2c3e50', marginTop: '24px' }}>🍽️ 食事</h4>
        {dailyMeals.length === 0 ? (
          <p>この日の記録はありません（1）</p>
        ) : (
          <ul>
            {dailyMeals.map((meal) => (
              <li key={meal.id}>
                <strong>{meal.time}</strong> {meal.food} : {meal.calories} kcal
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;