/* La gente que pasea por la acera del patio y lo que dice al hablar con ella (yard.js).
   Cada frase es un texto, o una lista de textos para una pequeña conversación: los que empiezan
   por «D:» los dice Diego. Se elige una al azar sin repetir las últimas. Para añadir frases, basta
   con escribirlas aquí. */
var PEOPLE = {
  names: {
    adult: ['Laura', 'Javier', 'Marta', 'Sergio', 'Elena', 'Rubén', 'Nuria', 'Álvaro', 'Irene', 'Dani'],
    kid: ['Hugo', 'Lucía', 'Mateo', 'Sofía', 'Leo', 'Valeria', 'Pablo', 'Martina'],
    elder: ['Doña Carmen', 'Don Paco', 'Doña Pilar', 'Don Manolo', 'Doña Rosario', 'Don Julián']
  },
  lines: {
    adult: [
      // fútbol
      '¿Viste el partido de anoche? Yo no pude, pero me lo fueron contando gol a gol por el grupo de la familia.',
      'Este año sí que sí, ¿eh? Bueno, eso lo digo todos los años.',
      'En Madrid hay que elegir: Madrid, Atleti, Rayo o Getafe. Y luego aguantar a tu cuñado, que es del otro.',
      ['¿Echamos un partidillo en tu portería algún día?', 'D: Cuando quieras. Te aviso: el portero es muy bueno.', 'Eso lo dicen todos hasta que tiro yo.'],
      'He visto el resumen del partido tres veces. Sigue sin ser penalti.',
      // Diego es del Madrid, pero no lo dice: solo lo deja caer
      ['Oye, ¿y tú de qué equipo eres?', 'D: Digamos que los miércoles de Champions no hago planes.', 'Vale, vale. No hace falta que digas más.'],
      ['¿Viste la remontada? Yo a falta de cinco minutos ya me había ido a dormir.', 'D: Error de principiante. Hasta el final, siempre.'],
      // sus cosas
      'Voy con prisa, que me he dejado la lavadora puesta. ¡Buenas!',
      'He aparcado a cuatro calles. En Madrid eso es aparcar en la puerta.',
      'Hoy teletrabajo. Que es como trabajar, pero en zapatillas.',
      'El metro iba hasta arriba. He hecho amigos a la fuerza.',
      'Vengo del gimnasio. Bueno, de pasar por delante del gimnasio.',
      ['¿Tú eres el que estudia inteligencia artificial?', 'D: El mismo.', 'Pues a ver si me haces un robot que me planche las camisas.'],
      'Qué bien huele tu huerto desde aquí. ¿Esos tomates son de los buenos?',
      '¿Sabes si abre hoy la frutería de la esquina? Siempre se me olvida qué día cierra.'
    ],
    kid: [
      // fútbol
      '¡Ayer metí tres goles en el recreo! Bueno, dos. Uno fue de rebote, pero cuenta.',
      '¿Me cambias un cromo? Tengo al portero repetido tres veces.',
      ['¿Esa portería es tuya? ¡Qué suerte!', 'D: Puedes tirar un penalti cuando quieras.', '¡Sí! Pero tú de portero, que yo tiro muy fuerte.'],
      'De mayor voy a ser futbolista. O astronauta. O youtuber. O las tres cosas.',
      ['¿Quién es tu jugador favorito?', 'D: Uno que vista de blanco. Con eso te lo digo todo.'],
      // sus cosas
      ['¡Mi conejo se llama Copito! ¿Y el tuyo?', 'D: Patricio. Se pasa el día haciendo sniff, sniff.', '¡Jajaja! Copito también. Serán primos.'],
      '¡Hoy no hay deberes! Bueno, sí hay, pero no me acuerdo de cuáles.',
      ['¿Ese robot que te sigue es tuyo? ¿Muerde?', 'D: Solo si le hablas de errores en el código.'],
      'Mi madre dice que no hable con desconocidos, pero tú eres el vecino, ¿no?',
      'Ayer me pasé un juego entero. En modo fácil, pero entero.',
      '¡Mira, una mariquita! …Ah, no, es un trozo de chicle.',
      '¿Sabías que los pulpos tienen tres corazones? Me lo ha dicho la profe.'
    ],
    elder: [
      // fútbol
      'El fútbol de ahora es muy rápido. En mis tiempos el balón pesaba como un melón y nadie se quejaba.',
      'Yo los partidos los sigo por la radio, como siempre. En la tele no se emociona nadie igual.',
      'Mi nieto me explica eso del fuera de juego cada domingo. Y cada domingo se me olvida.',
      ['Yo fui al Bernabéu por primera vez con mi padre. ¿Tú has ido alguna vez?', 'D: Alguna que otra. Ese estadio tiene algo especial.', 'Ay, hijo… Entonces nos entendemos.'],
      // sus cosas
      'Mira qué columpio más bonito. Yo de joven me tiraba en marcha, y aquí sigo.',
      ['Los tomates como los del pueblo no hay. ¿Los tuyos de dónde son?', 'D: De Extremadura, como yo.', 'Ya decía yo que tenían buena cara.'],
      'Hijo, abrígate, que el aire de la sierra corta aunque luzca el sol.',
      '¿Y ese conejo que tienes? Cuídalo bien, que se encariñan mucho.',
      'Antes todo esto era campo. Bueno, eso lo decimos todos, pero es que era verdad.',
      'A mi nieto también le gustan mucho los ordenadores. Ese y tú os entenderíais.',
      'Camino media hora cada día. Me lo dijo el médico, y el médico manda.',
      'Voy al mercado, que si llego tarde ya no queda pescado bueno.'
    ]
  },
  // de noche se suman estas (de noche no pasean niños)
  night: {
    adult: [
      'Vuelvo de trabajar. Qué ganas de cena y sofá.',
      'Buenas noches. Si oyes ladrar, es mi perro, que le ladra a la luna.',
      '¿Tú también despierto a estas horas? Los de ordenadores sois como los búhos.'
    ],
    elder: [
      'Saco al perro antes de dormir. Bueno, más bien me saca él a mí.',
      'Con lo bonita que está la noche, da pena meterse en casa.'
    ]
  }
};
// en inglés (los nombres se quedan como están)
I18N.deep(PEOPLE.lines); I18N.deep(PEOPLE.night);
