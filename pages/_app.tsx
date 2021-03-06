import { Fuego, FuegoProvider } from '@nandorojo/swr-firestore'
import 'firebase/auth'
import 'firebase/firestore'
import { AppProps } from 'next/app'
import React from 'react'
import Layout from '../components/Layout'
import { ProvideAuth } from '../hooks/useAuth'
import '../styles/globals.css'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
}

const fuego = new Fuego(firebaseConfig)

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <FuegoProvider fuego={fuego}>
      <ProvideAuth>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ProvideAuth>
    </FuegoProvider>
  )
}

export default App
