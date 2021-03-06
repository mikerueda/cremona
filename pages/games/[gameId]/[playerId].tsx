import classnames from 'classnames'
import React, { useState } from 'react'
import Heading from '../../../ui/Heading'
import { useRouter } from 'next/router'
import { useDocument } from '@nandorojo/swr-firestore'
import { Game, Option } from '../../../types/Game'
import { Player } from '../../../types/Player'
import Button from '../../../ui/Button'
import useCremona from '../../../hooks/useCremona'
import useAudio from '../../../hooks/useAudio'
import useInterval from '../../../hooks/useInterval'
import Countdown from '../../../components/Countdown'
import Link from 'next/link'
import A from '../../../ui/A'

const PlayerId = () => {
  const router = useRouter()
  const gameId = Array.isArray(router.query.gameId)
    ? router.query.gameId[0]
    : router.query.gameId
  const playerId = Array.isArray(router.query.playerId)
    ? router.query.playerId[0]
    : router.query.playerId

  const { data: game, error, loading } = useDocument<Game>(
    gameId ? `challenges/${gameId}` : null,
    {
      parseDates: ['createdAt'],
      listen: true,
    },
  )
  const {
    data: player,
    error: errorPlayer,
    loading: loadingPlayer,
    update,
  } = useDocument<Player>(
    playerId ? `challenges/${gameId}/players/${playerId}` : null,
    {
      listen: true,
    },
  )

  if (loading || loadingPlayer) {
    return <p className="italic text-center">Loading...</p>
  }

  if (error || errorPlayer) {
    return <p className="italic text-center">There was an error.</p>
  }

  if (!game || !game.id || !player) {
    return (
      <p className="italic text-center">There is no challenge or player.</p>
    )
  }

  /* TODO: verify game and player status */
  if (player.status === 'finished') {
    /* return <PlayerScore /> */
    return (
      <>
        <p>You finished with {player.score} points.</p>
        <div className="mt-4">
          <Link href="/games/[gameId]" as={`/games/${gameId}`} passHref>
            <A href="#!">Go back</A>
          </Link>
        </div>
      </>
    )
  }

  const onFinish = (score: number) => {
    console.log(score)

    update({
      status: 'finished',
      score,
    })
  }

  return (
    <>
      <Heading type="h1">{game.name}</Heading>
      {player.status === 'playing' ? (
        <PlayerGame game={game} onFinish={onFinish} />
      ) : (
        <Button
          onClick={() => {
            update({
              status: 'playing',
            })
          }}
        >
          Play
        </Button>
      )}
    </>
  )
}

export default PlayerId

type GameProps = {
  game: Game
  onFinish: (score: number) => void
}

function PlayerGame({ game, onFinish }: GameProps) {
  const {
    currentIndex,
    totalQuestions,
    update,
    gameEnded,
    successfulChoices,
  } = useCremona(game, onFinish)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const { toggle: playError } = useAudio('/sounds/error.mp3', 0.2)
  const { toggle: playSuccess } = useAudio('/sounds/success.mp3', 0.9)
  const { playing, toggle: toggleBackground } = useAudio(
    '/sounds/background.mp3',
    0.1,
  )
  const [showNext, setShowNext] = useState(false)

  useInterval(
    () => {
      if (!playing) {
        toggleBackground()
      }
    },
    100,
    !showNext,
  )

  const currentQuestion = game.questions[currentIndex]

  if (gameEnded) {
    return <Heading type="h2">You got {successfulChoices * 10} points.</Heading>
  }

  return (
    <div className="">
      <div className="mb-4">
        <Heading type="h2">{currentQuestion.description}</Heading>
      </div>
      <ul className="flex flex-wrap">
        {currentQuestion.options.map((option) => (
          <li key={option.id} className="w-1/2">
            <button
              className={classnames([
                'block px-4 py-2 my-4 bg-white border w-full text-left',
                showNext &&
                  currentQuestion.validOption === option.id &&
                  'bg-green-300',
                showNext &&
                  currentQuestion.validOption !== option.id &&
                  'bg-red-300',
              ])}
              onClick={() => {
                setSelectedOption(option)
                setShowNext(true)

                toggleBackground()

                if (currentQuestion.validOption === option.id) {
                  playSuccess()
                } else {
                  playError()
                }
              }}
              disabled={!!selectedOption}
            >
              {selectedOption?.id === option.id && '😎  '}
              {option.content}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center italic">
        Question {currentIndex + 1} of {totalQuestions}
      </p>
      {showNext && (
        <Button
          onClick={() => {
            update(selectedOption)
            setSelectedOption(null)
            setShowNext(false)
          }}
        >
          {currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
        </Button>
      )}
      {!showNext && (
        <div className="mt-4">
          <Countdown
            time={currentQuestion.time}
            onFinish={() => {
              playError()
              setSelectedOption(null)
              setShowNext(true)
            }}
          />
        </div>
      )}
    </div>
  )
}
