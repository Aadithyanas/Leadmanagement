import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Trophy, Play, RotateCcw, Gamepad2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 30;
const INITIAL_SNAKE: Point[] = [
  { x: 15, y: 15 },
  { x: 15, y: 16 },
  { x: 15, y: 17 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const INITIAL_SPEED = 150; // ms per frame

interface Score {
  id: string;
  user_name: string;
  score: number;
}

export function SnakeGame() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const [highScores, setHighScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);

  // Use refs for state accessed inside setInterval to avoid stale closures
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const isPlayingRef = useRef(isPlaying);
  const gameOverRef = useRef(gameOver);
  const speedRef = useRef(speed);

  useEffect(() => {
    directionRef.current = direction;
    snakeRef.current = snake;
    foodRef.current = food;
    isPlayingRef.current = isPlaying;
    gameOverRef.current = gameOver;
    speedRef.current = speed;
  }, [direction, snake, food, isPlaying, gameOver, speed]);

  // Fetch high scores
  const fetchScores = async () => {
    setLoadingScores(true);
    const { data, error } = await supabase
      .from('snake_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching scores:', error);
    } else if (data) {
      setHighScores(data);
    }
    setLoadingScores(false);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Ensure food doesn't spawn on the snake
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
    setIsPlaying(true);
  };

  const handleGameOver = async (finalScore: number) => {
    setIsPlaying(false);
    setGameOver(true);

    if (finalScore > 0 && user) {
      try {
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous';
        await supabase.from('snake_scores').insert({
          user_id: user.id,
          user_name: userName,
          score: finalScore
        });
        toast({
          title: "Score Saved!",
          description: `You scored ${finalScore} points!`,
        });
        fetchScores(); // Refresh scoreboard
      } catch (err) {
        console.error("Failed to save score", err);
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (!isPlayingRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game Loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying) {
      intervalId = setInterval(() => {
        if (gameOverRef.current) return;

        const currentSnake = [...snakeRef.current];
        const head = { ...currentSnake[0] };

        // Move head
        switch (directionRef.current) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleGameOver(score);
          return;
        }

        // Check Self Collision
        for (let segment of currentSnake) {
          if (head.x === segment.x && head.y === segment.y) {
            handleGameOver(score);
            return;
          }
        }

        currentSnake.unshift(head); // Add new head

        // Check Food Collision
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          setScore(s => s + 10);
          setSpeed(s => Math.max(50, s - 5)); // Increase speed
          setFood(generateFood(currentSnake));
        } else {
          currentSnake.pop(); // Remove tail if no food eaten
        }

        setSnake(currentSnake);
      }, speedRef.current);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, generateFood, score]); // Dependencies intentionally sparse due to refs

  // Draw Game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e1e2f'; // Dark slate background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (optional, adds nice retro feel)
    const CELL_SIZE = canvas.width / GRID_SIZE;
    ctx.strokeStyle = '#2a2a40';
    ctx.lineWidth = 1;
    for(let i=0; i<=GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw Food (Egg)
    ctx.fillStyle = '#ef4444'; // Red egg
    ctx.beginPath();
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.arc(foodX, foodY, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Snake
    snake.forEach((segment, index) => {
      // Head is a different color
      ctx.fillStyle = index === 0 ? '#10b981' : '#34d399';
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

  }, [snake, food]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entertainment Center</h1>
        <p className="text-muted-foreground">Take a quick break and play some Snake.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Game Area */}
        <Card className="lg:col-span-2 overflow-hidden border-border/50 shadow-lg relative">
            <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Gamepad2 className="h-5 w-5 text-indigo-500" />
                        Snake Game
                    </CardTitle>
                    <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full font-bold">
                        Score: {score}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center bg-zinc-950/50">
                <div className="relative rounded-lg overflow-hidden ring-4 ring-white/5 shadow-2xl">
                    <canvas 
                        ref={canvasRef}
                        width={600} 
                        height={600}
                        className="bg-black block mx-auto max-w-full aspect-square h-auto"
                    />

                    {/* Overlays */}
                    {!isPlaying && !gameOver && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                            <Gamepad2 className="h-16 w-16 text-white/50 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">Ready to Play?</h3>
                            <p className="text-white/70 mb-6 max-w-xs">Use the Arrow Keys on your keyboard to move. Eat the red eggs to grow.</p>
                            <Button size="lg" onClick={startGame} className="gap-2">
                                <Play className="h-4 w-4" /> Start Game
                            </Button>
                        </div>
                    )}

                    {gameOver && (
                        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in zoom-in duration-300">
                            <h3 className="text-4xl font-bold text-white mb-2 text-shadow">Game Over!</h3>
                            <p className="text-xl text-white/90 mb-8 font-medium">Final Score: {score}</p>
                            <Button size="lg" variant="secondary" onClick={startGame} className="gap-2">
                                <RotateCcw className="h-4 w-4" /> Play Again
                            </Button>
                        </div>
                    )}
                </div>
                
                {/* Mobile Controls Hint */}
                <div className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-4 flex-wrap">
                     <span>Keyboard required:</span>
                     <div className="flex gap-2">
                         <kbd className="px-2 py-1 bg-muted rounded border shadow-sm">↑</kbd>
                         <kbd className="px-2 py-1 bg-muted rounded border shadow-sm">↓</kbd>
                         <kbd className="px-2 py-1 bg-muted rounded border shadow-sm">←</kbd>
                         <kbd className="px-2 py-1 bg-muted rounded border shadow-sm">→</kbd>
                     </div>
                </div>
            </CardContent>
        </Card>

        {/* Scoreboard Area */}
        <Card className="h-fit">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-amber-500">
                    <Trophy className="h-5 w-5" />
                    Global Top Scores
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loadingScores ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse">Loading scores...</div>
                ) : highScores.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No scores yet. Be the first!</div>
                ) : (
                    <ul className="divide-y divide-border/50">
                        {highScores.map((hs, i) => (
                            <li key={hs.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                        i === 0 ? 'bg-amber-500 text-white' : 
                                        i === 1 ? 'bg-slate-300 text-slate-800' : 
                                        i === 2 ? 'bg-amber-700 text-white' : 
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                        {i + 1}
                                    </span>
                                    <span className="font-medium truncate max-w-[120px]" title={hs.user_name}>
                                        {hs.user_name}
                                    </span>
                                </div>
                                <span className="font-mono font-bold text-primary">
                                    {hs.score}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
