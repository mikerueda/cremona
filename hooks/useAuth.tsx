import { fuego } from '@nandorojo/swr-firestore'
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type ContextData = {
  user: firebase.User | null
  signin: (email: string, password: string) => Promise<firebase.User | null>
  signup: (email: string, password: string) => Promise<firebase.User | null>
  signout: () => Promise<void>
  googleSignIn: () => Promise<firebase.User | null>
}

const defaultContextData = {
  user: null,
  signin: () => Promise.resolve(null),
  signup: () => Promise.resolve(null),
  signout: () => Promise.resolve(void 0),
  googleSignIn: () => Promise.resolve(null),
}

const AuthContext = createContext<ContextData>(defaultContextData)

type Props = {
  children: ReactNode
}

export function ProvideAuth({ children }: Props) {
  const auth = useProvideAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}

export const useUser = () => {
  const { user } = useContext(AuthContext)

  if (!user) {
    throw new Error('User is empty')
  }

  return user
}

function useProvideAuth() {
  const [user, setUser] = useState<firebase.User | null>(null)

  const signin = (email: string, password: string) => {
    return fuego
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((response) => {
        setUser(response.user)
        return response.user
      })
  }

  const signup = (email: string, password: string) => {
    return fuego
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((response) => {
        setUser(response.user)
        return response.user
      })
  }

  const googleSignIn = () => {
    const provider = new fuego.auth.GoogleAuthProvider()

    return fuego
      .auth()
      .signInWithPopup(provider)
      .then((response) => {
        setUser(response.user)
        return response.user
      })
  }

  const signout = () => {
    return fuego
      .auth()
      .signOut()
      .then(() => {
        setUser(null)
      })
  }

  useEffect(() => {
    const unsubscribe = fuego.auth().onAuthStateChanged((user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    signin,
    googleSignIn,
    signup,
    signout,
  }
}
