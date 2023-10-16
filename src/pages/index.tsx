import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { api } from "~/utils/api";

export default function Home() {
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary to-secondary">
        <div className="absolute bottom-0 left-0 w-screen h-4/6 bg-gradient-to-t from-yellow-900 via-yellow-500 to-transparent -z-10"/>
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            <Image
              src="/img/taco.png"
              alt="taco"
              className="mx-auto"
              width={200}
              height={200}
              priority
            />
            Kudo Taco
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="https://create.t3.gg/en/usage/first-steps"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">First Steps →</h3>
              <div className="text-lg">
                Just the basics - Everything you need to know to set up your
                database and authentication.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Documentation →</h3>
              <div className="text-lg">
                Learn more about Create T3 App, the libraries it uses, and how
                to deploy it.
              </div>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => void signIn('slack')}
              style={{
                alignItems: 'center',
                color:'#000',
                backgroundColor:'#fff',
                border:'1px solid #ddd',
                borderRadius:'4px',
                display:'inline-flex',
                fontFamily:'Lato, sans-serif',
                fontSize:'16px',
                fontWeight:'600',
                height:'48px',
                justifyContent:'center',
                textDecoration:'none',
                width:'256px'
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{height:'20px',width:'20px',marginRight:'12px'}} viewBox="0 0 122.8 122.8">
                <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"></path>
                <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"></path>
                <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"></path>
                <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"></path>
              </svg>
              Sign in with Slack
            </button>
            <AuthShowcase />
          </div>
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data: session } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: session?.user !== undefined }
  );
  const kudos = api.kudo.getAllBySlackTeamId.useQuery({
    slackTeamId: session?.user?.slackTeamId ?? "",
  }, {
    enabled: session?.user?.slackTeamId !== undefined
  });
  console.log({ kudos, teamId: session?.user?.slackTeamId })
  const clear = api.user.clearDatabase.useMutation();

  const handleClear = async () => {
    await clear.mutateAsync();
    alert("cleared");
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button onClick={() => void handleClear()} className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">
        Clear database
      </button>
      <p className="text-center text-2xl text-white">
        {session && <span>Logged in as {session.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={session ? () => void signOut() : () => void signIn('slack')}
      >
        {session ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}