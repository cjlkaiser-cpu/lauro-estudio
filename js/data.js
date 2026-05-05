// Pasajes del Joropo de Antonio Lauro (arm. Luis Álvarez)
// 6/8 · ♩= 140 · 104 compases
const PASAJES = [

    // ── PARTE I: EXPOSICIÓN ──────────────────────────────────────────────────
    {
        numero: 1,
        titulo: "Motivo inicial",
        compases: "1–8",
        imagen: "img/pagina_1.png",
        texto: "El joropo arranca in medias res: la guitarra irrumpe directamente en el tema sin preludio. Los primeros cuatro compases exponen el motivo principal, una célula melódica de tres notas con contorno ascendente que sube por grados conjuntos y se lanza a un intervalo de tercera. El ritmo es el del joropo llanero clásico: el 6/8 crea una ambigüedad constante entre la agrupación binaria y la ternaria, y aquí se resuelve claramente en pulsación de corchea. El bajo articulado en notas sueltas sostiene la armonía sin ornamentación. Lauro usa el re menor como punto de reposo pero no como punto de llegada: la semicadencia al final de la frase deja la tensión sin resolver, impulsando hacia adelante.",
        seccion: "parte-1"
    },
    {
        numero: 2,
        titulo: "Respuesta y voltas",
        compases: "9–20",
        imagen: "img/pagina_1.png",
        texto: "La frase de respuesta (c. 9–12) invierte el gesto del motivo inicial: la melodía desciende cromáticamente antes de recuperar la curva ascendente. La escritura se densifica con acordes de dos y tres notas que amplían la textura desde la voz solista hacia el pleno polifónico de la guitarra. El pasaje culmina en las casillas 1.ª y 2.ª (c. 17–20): la primera casilla regresa al principio de la sección; la segunda pivota hacia el tono relativo mayor (Fa mayor, c. 19–20) preparando la entrada del segundo tema. Técnicamente es exigente porque obliga a cambios de posición rápidos mientras se sostiene la pulsación de corchea.",
        seccion: "parte-1"
    },

    // ── PARTE II: DESARROLLO ─────────────────────────────────────────────────
    {
        numero: 3,
        titulo: "Segundo tema",
        compases: "21–32",
        imagen: "img/pagina_2.png",
        texto: "El segundo tema (c. 21) introduce un carácter distinto: la línea melódica es más cantábile, con valores más largos en la voz superior y un acompañamiento más fluido en el bajo. La armonía se aleja del re menor original y explora la región de la dominante (la menor y La mayor), subrayando la relación modal característica del joropo venezolano. Lauro usa aquí saltos de sexta y séptima que evocan el vuelo de la melodía vocal original, recordando que este joropo fue antes una canción. El tresillo de corcheas que aparece esporádicamente es otra marca de estilo: en el joropo, la hemiola (dos grupos de tres corcheas contra tres grupos de dos) es un ornamento estructural, no un accidente rítmico.",
        seccion: "parte-2"
    },
    {
        numero: 4,
        titulo: "Intensificación y voltas",
        compases: "33–48",
        imagen: "img/pagina_2.png",
        texto: "La sección de desarrollo se intensifica con las casillas de repetición de c. 33: la primera casilla amplía la frase armónicamente (cadencia al IV antes de volver), la segunda propulsa hacia el material central. El tejido polifónico se hace más denso: el bajo cobra protagonismo propio y dialoga en contrapunto con la voz superior, rasgo que distingue la escritura guitarrística de Lauro de otros arreglistas venezolanos. Las secciones entre c. 37 y c. 48 acumulan tensión mediante una escala cromática en el bajo y un desplazamiento paulatino del acento que anticipa el climax de la Parte III.",
        seccion: "parte-2"
    },

    // ── PARTE III: CENTRO ────────────────────────────────────────────────────
    {
        numero: 5,
        titulo: "Material central",
        compases: "49–60",
        imagen: "img/pagina_3.png",
        texto: "El corazón de la pieza. La textura se aligera momentáneamente (c. 49–52) antes de que aparezca el pasaje técnicamente más exigente de la obra: una serie de arpegios rápidos de semicorcheas que recorren la extensión completa de la guitarra. La armonía oscila entre re menor y su homónimo mayor (Re mayor), creando ese efecto de luminosidad súbita tan querido por Lauro. Este pasaje —con sus acordes rasgados y la melodía que sube una octava respecto a la exposición— es el climax emocional de la primera mitad. La dificultad técnica está en mantener el tempo (♩= 140) mientras se articulan con claridad las notas del bajo y las notas de paso cromáticas de la voz superior.",
        seccion: "parte-3"
    },
    {
        numero: 6,
        titulo: "Modulación hacia Mi mayor",
        compases: "61–76",
        imagen: "img/pagina_3.png",
        texto: "La sección de transición (c. 61–76) lleva a cabo una modulación gradual pero determinada hacia Mi mayor, la región tonal del final de la pieza. La armonía pivota a través de Si mayor (dominante de Mi) en c. 65, y la melodía abandona los giros de re menor para adoptar los giros brillantes y abiertos del modo mayor. Las figuras de semicorchea se estabilizan y la escritura se hace más acordal, preparando el terreno para la reexposición. El bajo mantiene un pedal sobre Si (dominante de Mi mayor) durante varios compases —un gesto retórico clásico de preparación—, y la sensación es de apertura y de llegada inminente a algo luminoso.",
        seccion: "parte-3"
    },

    // ── PARTE IV: FINAL ──────────────────────────────────────────────────────
    {
        numero: 7,
        titulo: "Reexposición en Mi mayor",
        compases: "77–88",
        imagen: "img/pagina_4.png",
        texto: "La armadura de cuatro sostenidos que aparece en c. 77 es el momento de máxima apertura tonal de la obra: el mismo motivo principal que arrancó en re menor regresa ahora transfigurado en Mi mayor, como si se hubiera levantado la niebla llanera y apareciera el sol. La melodía suena más alta, más brillante, y los acordes tienen ese timbre abierto característico de Mi mayor en guitarra (cuerdas al aire I, II y VI). Lauro exprime al máximo el contraste: mismo material temático, carácter completamente distinto. Las casillas de c. 85–88 introducen una pequeña variante cadencial que conduce directamente a la coda.",
        seccion: "parte-4"
    },
    {
        numero: 8,
        titulo: "Coda y fermata final",
        compases: "89–104",
        imagen: "img/pagina_4.png",
        texto: "La segunda casilla de c. 89 lanza la coda con un arranque súbito de tresillos y acordes sostenidos que recapitulan el espíritu del joropo antes de la cadencia definitiva. Los compases finales (c. 100–104) reducen la textura a un acorde pleno con la melodía en la voz superior, disminuyen la densidad rítmica y concluyen con una fermata sobre el acorde de Mi mayor en primera posición. El cambio de compás a 2/4 en el penúltimo compás —visible en la partitura— es un accelerando escrito que da impulso al acorde conclusivo. La fermata final tiene algo de suspenso dramático: el joropo se detiene en el aire, como si la música se resistiera a desaparecer.",
        seccion: "parte-4"
    }
];
