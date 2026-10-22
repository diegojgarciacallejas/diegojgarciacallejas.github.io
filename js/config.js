/* Ajustes y textos. Todo lo que quieras cambiar sin tocar código está aquí. */
var CFG = {
  W: 960, H: 540,
  font: '"Pixelify Sans", "Courier New", monospace',
  // paleta
  c: {
    bg: 0x0f0a1e, panel: 0x120c22, line: 0x8a78c8, cream: '#f3eedc', dim: '#8e86a8',
    blue: 0x7aa7ee, blueTxt: '#7aa7ee', violet: 0x4b3a82, shadow: 0x2a1f4f,
    green: '#3f9a68', greenDark: '#1a5a40', greenDeep: '#0a3322', white: '#ece9de', white2: '#d6d1bf', gray: '#6f6a85'
  },
  name: 'Diego',
  fontUi: '"Jersey 20", "Courier New", monospace',
  // enlaces de los iconos de la portada
  links: [
    { icon: 'mail',     label: 'Correo',   mailto: ['d.j.garciacallejas', 'gmail.com'] },
    { icon: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/diegojosegarciacallejas' },
    { icon: 'github',   label: 'GitHub',   url: 'https://github.com/diegojgarciacallejas' }
  ],
  // puertas laterales del cuarto (de momento solo cuentan adónde llevan)
  // salidas (dónde están: WALK_ROOM.exits y WALK_YARD.exits). to: escena a la que lleva; url: página;
  // text: si lo tiene, Diego pregunta antes de salir
  exits: {
    pasillo:  { label: '← Patio', to: 'Yard' },
    vestidor: { label: 'Vestidor →', title: 'Expediente', url: 'cv/', text: 'Mi vestidor: aquí cuelgo mi expediente, el traje que me pongo para las entrevistas. ¡Pasa y échale un vistazo!' },
    menu:     { label: '↓ Menú', to: 'Menu' },
    casa:     { label: 'Volver a casa →', to: 'Room' }
  },
  // barra de abajo con los controles durante el juego
  controls: 'Flechas / WASD: andar   ·   Clic en el suelo: ir   ·   Enter, E o clic en la exclamación: interactuar   ·   Esc: menú',
  // barra de arriba en el patio
  controlsSwing: '¡A columpiarse!   ·   Enter, Esc, una flecha o clic para bajarte',
  controlsYard: 'Flechas / WASD: andar  ·  Clic: ir  ·  Habla con la gente desde la valla  ·  Esc: volver a casa',
  // barra de abajo cuando el muñeco está junto a un objeto ({name} es el nombre del objeto)
  controlsNear: '{name}: Enter, E o clic para interactuar',
  // nombre y lo que dice cada objeto del cuarto (las posiciones están en interact.js)
  objects: {
    estanteria: { name: 'Estantería', text: 'Mis libros de estadística, álgebra y machine learning. Aquí irán las lecturas y apuntes que más me han servido.' },
    foto:       { name: 'Foto de la cumbre', text: 'Una foto en la cumbre. La montaña es mi manera de desconectar; aquí contaré algunas rutas.' },
    escritorio: { name: 'Ordenador', url: 'os/', desktopOnly: true, text: 'Mi ordenador, con DiegOS: un escritorio con terminal, carpetas y todos mis proyectos. Pulsa Continuar para encenderlo.' },
    papelera:   { name: 'Papelera', text: 'Papeles arrugados: todas las versiones de mis modelos que no funcionaron. De ellas también se aprende.' },
    ventana:    { name: 'Ventana', action: 'weather' },   // dice el tiempo que hace ahora en Madrid (weather.js)
    grafico:    { name: 'Gráfico', text: 'Un gráfico de barras. Aquí enseñaré algunos de mis análisis de datos.' },
    redneuronal: { name: 'Red neuronal', url: 'lab/red-neuronal/', text: 'El esquema de una red neuronal. ¿Quieres ver una por dentro y entrenarla tú? Pulsa Continuar para ir al laboratorio.' },
    pared:      { name: 'Reloj y bandera', text: '¿Qué quieres mirar?' },   // los dos juntos: se elige uno
    bandera:    { name: 'Bandera de Extremadura', short: 'Bandera', text: 'La bandera de Extremadura: verde, blanca y negra. Mi tierra, aunque ahora esté en Madrid.' },
    reloj:      { name: 'Reloj', action: 'clock' },   // abre el panel con la hora (clock.js)
    mesilla:    { name: 'Mesilla', text: 'La lámpara y el libro que tengo a medias. Aquí irá lo que estoy leyendo y aprendiendo ahora.' },
    cuaderno:   { name: 'Cuaderno', url: 'cv/', text: 'Mi cuaderno: aquí tengo apuntado todo mi expediente. Pulsa Continuar para abrirlo.' },
    tortuga:    { name: 'Manuelita', lines: ['Es Manuelita, una tortuga de peluche. Lleva una etiqueta cosida en la pata… a ver qué pone.',
      '«Manuelita, te quiero.»', '¿De quién será este regalo? Quien la eligió lo hizo con mucho cariño.'] },
    cama:       { name: 'Cama', text: 'En la cama están Manuelita y mi cuaderno. ¿Qué miro?' },   // se elige entre los dos
    servidor:   { name: 'Servidor', text: 'El servidor de entrenamiento, tumbado en el suelo porque no cabía de pie. Sus lucecitas parpadean mientras los modelos aprenden.' },
    robot:      { name: 'Robot', url: 'lab/digitos/', text: 'Un robot con visión artificial: reconoce los números que le dibujes. Pulsa Continuar para probarlo.' },
    puf:        { name: 'Portátil', url: 'lab/rutas/', text: 'En el portátil tengo un buscador de caminos: A* buscando la ruta más corta. Pulsa Continuar para jugar con él.' },
    vecino:     { name: 'Vecino', action: 'talk' },   // quien pase por la acera (su nombre y sus frases: people.js)
    // objetos ocultos (logros.js)
    peseta:     { name: 'Peseta antigua', text: '¡Una peseta! Debió de rodar debajo de algo hace muchos años. Me la guardo, por si vuelven.' },
    tenis:      { name: 'Pelota de tenis', text: 'Una pelota de tenis escondida entre los setos. Me recuerda al verano que di clases de tenis en el campamento.' },
    bellota:    { name: 'Bellota', text: 'Una bellota. Aquí no hay encinas… alguien la ha traído de Extremadura. Huele a dehesa.' },
    conejo:     { name: 'Patricio', who: 'Patricio', voice: 1.9, portrait: 'bunny_a', portraitScale: 6,   // habla él (y sale su cara)
      texts: ['*Sniff, sniff…*', '*Sniff sniff* …*te mira fijamente y mueve la nariz*', '*Sniff…* ¿Eso que llevas es una zanahoria? *sniff sniff*',
        '*Thump, thump* …*golpea el suelo con la pata*', '*Sniff…* …*se rasca una oreja y sigue a lo suyo*'] },
    piezas:     { name: 'Piezas de construcción', url: 'juegos/piezas/', text: 'Mis piezas de construcción. ¿Montamos algo? Hay varios modelos para copiar pieza a pieza, en 3D. Pulsa Continuar para jugar.' },
    pecera:     { name: 'Pecera', text: 'Tres peces nadando. Algún día se moverán en banco con un algoritmo de enjambre.' },
    // patio
    porteria:   { name: 'Portería', action: 'penalty' },   // abre el minijuego de penaltis (penalty.js)
    columpio:   { name: 'Columpio', action: 'swing' },   // Diego se monta (yard.js: ride)
    huerto:     { name: 'Huerto', text: 'Mi huerto extremeño: pimientos para el pimentón de la Vera, tomates como los de las Vegas del Guadiana y unas flores. Huele a casa.' },
    ciudad:     { name: 'Madrid', text: 'Al fondo, Madrid: las Cuatro Torres, las torres KIO y la sierra de Guadarrama detrás. Aquí estudio y vivo ahora.' },
    chicles:    { name: 'Máquina de chicles', url: 'lab/kmeans/', text: 'Una máquina de chicles. ¿Cómo agruparías las bolas por colores sin que nadie te diga cuántos hay? Eso hace K-Means. Pulsa Continuar para probarlo.' },
    cactus:     { name: 'Cactus', action: 'water', text: 'Mi cactus redondo, el único ser vivo del cuarto que no pide atención. ¿Lo riego?' },
  },
  menu: [
    { id: 'full', icon: 'diego', label: 'Explorar',       hint: 'Camina por mi cuarto y descubre cada objeto' },
    { id: 'cv',   icon: 'doc',   label: 'Expediente',     url: 'cv/',     hint: 'Mi currículum en una sola página' },
    { id: 'os',   icon: 'pc',    label: 'DiegOS',         url: 'os/',  hint: 'Un escritorio retro con terminal, ventanas y carpetas' },
    { id: 'lab',  icon: 'lab',   label: 'Laboratorio IA', url: 'lab/', hint: 'Prueba mis modelos: red neuronal, dígitos, rutas y grupos' }
  ],
  intro: [
    { name: 'Diego', text: '¡Hola, visitante! Bienvenido a mi cuarto.' },
    { name: 'Diego', text: 'Soy Diego José García Callejas y estudio Ciencia de Datos e Inteligencia Artificial en la UPM.' },
    { name: 'Diego', text: 'Aquí guardo lo que construyo: modelos, simulaciones y experimentos que puedes probar tú mismo.' },
    { name: 'Diego', text: 'Date una vuelta por la habitación. Cada objeto esconde un proyecto, así que cotillea todo lo que quieras.' }
  ]
};
// en inglés, todos estos textos (i18n.js y lang-en.js)
I18N.deep(CFG);
