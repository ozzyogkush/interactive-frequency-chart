// import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './app.css';

function App() {
  return (
    <>
      <header>
        <a href='https://vite.dev' target='_blank'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </a>
        <a href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </header>
      <main>
        <section>SB</section>
        <section>B</section>
        <section>MR</section>
        <section>HM</section>
        <section>HF</section>
      </main>
      <aside>
        <section>Spectrum Data</section>
        <section>Instrument Data</section>
        <section>Ear Sensitivity</section>
        <section>Legend</section>
      </aside>
    </>
  );
}

export default App;
