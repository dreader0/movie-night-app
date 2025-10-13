import { useState } from "react";
import "./App.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const rounds = ["nominate", "veto", "rank", "winner"];

function MovieInput({ onSubmit }) {
  const [title, setTitle] = useState("");

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex">
        <div className="relative w-full">
          <input
            type="search"
            id="search-dropdown"
            className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-e-lg border-s-gray-50 border-s-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-s-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
            placeholder="Enter Movie Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            onClick={() => {
              onSubmit(title);
              setTitle("");
            }}
            className="absolute top-0 end-0 p-2.5 text-sm font-medium h-full text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <span>Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MovieItem({ id, canVeto, onVeto }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mx-auto flex max-w-sm justify-between items-center gap-x-4 rounded-xl bg-white p-6 m-4 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
    >
      {id}
      {canVeto ? <button onClick={() => onVeto(id)}>veto</button> : <></>}
    </div>
  );
}

function MovieList({ movies, handleDragEnd, round, handleVeto }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div>
      {["rank"].includes(round) ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={movies}
            strategy={verticalListSortingStrategy}
          >
            {movies.map((id) => (
              <MovieItem key={id} id={id} />
            ))}
          </SortableContext>
        </DndContext>
      ) : ["veto"].includes(round) ? (
        movies.map((id) => (
          <MovieItem key={id} id={id} canVeto={true} onVeto={handleVeto} />
        ))
      ) : (
        movies.map((id) => <MovieItem key={id} id={id} />)
      )}
    </div>
  );
}

export default function App() {
  const players = ["Player 1", "Player 2", "Player"];
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState("nominate");
  const [movies, setMovies] = useState([]); //'Parasite','Anora','Challengers', 'Trainspotting', 'It Follows'
  const [rankings, setRankings] = useState([]);
  const [finalScores, setFinalScores] = useState([]);
  const [winner, setWinner] = useState(null);

  const playerCount = players.length;
  const maxMovies = 2 * playerCount;

  function resetApp() {
    setTurn(0);
    setRound("nominate");
    setMovies([]);
    setRankings([]);
    setFinalScores([]);
    setWinner(null);
  }

  function nextRound() {
    const currentRoundIndex = rounds.indexOf(round);
    const currentRound = rounds[currentRoundIndex];

    let nextRoundIndex = currentRoundIndex + 1;

    if (["rank"].includes(currentRound)) {
      let nextTurn = turn + 1;
      if (nextTurn <= playerCount) {
        if (nextTurn != playerCount) {
          nextRoundIndex = currentRoundIndex;
        }
        const nextRankings = rankings.slice();
        nextRankings.push({ player: players[turn], ranking: movies });
        setRankings(nextRankings);
        setTurn(nextTurn);
      }
    }

    const nextRound = rounds[nextRoundIndex];
    if (nextRoundIndex >= rounds.length) {
      nextRoundIndex = 0;
      resetApp();
    }

    console.log(nextRound);
    if (["winner"].includes(nextRound)) {
      setWinner(calculateWinner());
    }
    setRound(rounds[nextRoundIndex]);
  }

  function submitMovie(title) {
    if (!movies.includes(title)) {
      const nextMovies = movies.slice();
      nextMovies.push(title);
      setMovies(nextMovies);
      if (nextMovies.length >= maxMovies) {
        nextRound();
      }
    } else {
      console.log("duplicate skipped");
    }
  }

  function handleDragEnd(event) {
    try {
      const { active, over } = event;
      if (active.id !== over.id) {
        setMovies((items) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);

          return arrayMove(items, oldIndex, newIndex);
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleVeto(title) {
    try {
      const nextMovies = movies.filter((movie) => movie != title);
      setMovies(nextMovies);
      if (nextMovies.length <= playerCount) {
        nextRound();
      }
    } catch (error) {
      console.error(error);
    }
  }

  function calculateWinner() {
    try {
      console.log(rankings);
      const rankArrays = rankings.map((item) => item.ranking);
      let scores = {};
      for (let ranking of rankArrays) {
        for (let movie of ranking) {
          if (!scores[movie]) {
            scores[movie] = playerCount - ranking.indexOf(movie);
          } else {
            scores[movie] =
              scores[movie] + playerCount - ranking.indexOf(movie);
          }
        }
      }
      console.log(scores);
      setFinalScores(
        movies.map((movie) => {
          return `${scores[movie]} - ${movie}`;
        })
      );
      return getMaxValueKey(scores);
    } catch (error) {
      console.error(error);
    }
  }

  function getMaxValueKey(obj) {
    return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4">
        <h1>what should we watch?</h1>
      </div>
      <div>
        {["nominate"].includes(round) ? (
          <MovieInput onSubmit={submitMovie} />
        ) : (
          <p>{["rank"].includes(round) ? players[turn] : ""}</p>
        )}
      </div>
      {winner ? (
        <MovieList
          movies={finalScores}
          handleDragEnd={handleDragEnd}
          round={round}
          handleVeto={handleVeto}
        />
      ) : (
        <MovieList
          movies={movies}
          handleDragEnd={handleDragEnd}
          round={round}
          handleVeto={handleVeto}
        />
      )}

      <button className="mt-4" onClick={nextRound}>
        next round
      </button>
    </div>
  );
}
