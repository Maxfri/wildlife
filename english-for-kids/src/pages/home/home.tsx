import React, { useState } from 'react';
import cardsData from '../../components/cards/CardsData';
import CateryList from '../../components/categoryList/categoryList';

export default function PageHome(): JSX.Element {
  const [categories] = useState(cardsData[0]);

  return (
    <section className="main-section">
      <h2>Home</h2>
      <CateryList categories={categories} />
    </section>
  );
}
