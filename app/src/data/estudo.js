// Liga cada questão do banco a um tema das videoaulas e sugere leituras para revisar.
import { todosItens } from './videoaulas.js';

// [disciplina da questão, padrão no "topic" da questão, id do tema em videoaulas.js]
// A ordem importa: a primeira regra que casar vence.
const REGRAS = [
  ['Português', /crase/i, 'pt-crase'],
  ['Português', /classes/i, 'pt-classes'],
  ['Português', /interpreta|coes/i, 'pt-interpretacao'],
  ['Português', /gênero/i, 'pt-generos'],
  ['Português', /semântica/i, 'pt-semantica'],
  ['Português', /verbo|tempos/i, 'pt-verbos'],
  ['Português', /flexão/i, 'pt-flexao'],
  ['Português', /tratamento/i, 'pt-tratamento'],
  ['Português', /colocação/i, 'pt-colocacao'],
  ['Português', /concordância/i, 'pt-concordancia'],
  ['Português', /regência/i, 'pt-regencia'],
  ['Português', /ortografia|acentua/i, 'pt-ortografia'],
  ['Português', /pontuação/i, 'pt-pontuacao'],
  ['Português', /figuras/i, 'pt-figuras'],
  ['Português', /funções/i, 'pt-funcoes'],
  ['Português', /vícios/i, 'pt-vicios'],
  ['Português', /discurso/i, 'pt-discurso'],

  ['Matemática', /volume|espacial/i, 'mt-volume'],
  ['Matemática', /tales|pitágoras/i, 'mt-tales-pitagoras'],
  ['Matemática', /equaç|sistemas/i, 'mt-equacoes'],
  ['Matemática', /média/i, 'mt-media'],
  ['Matemática', /mdc|mmc/i, 'mt-mdc-mmc'],
  ['Matemática', /progress/i, 'mt-progressoes'],
  ['Matemática', /polinômio/i, 'mt-polinomios'],
  ['Matemática', /medidas/i, 'mt-medidas'],
  ['Matemática', /geometria plana/i, 'mt-area'],
  ['Matemática', /razão|regra de três/i, 'mt-proporcao'],
  ['Matemática', /porcentage|juros/i, 'mt-porcentagem'],
  ['Matemática', /conjuntos/i, 'mt-conjuntos'],
  ['Matemática', /dados|tabela|gráfico/i, 'mt-graficos'],
  ['Matemática', /operaç|fraç/i, 'mt-operacoes'],

  ['Legislação', /constituição/i, 'lg-cf'],
  ['Legislação', /eca/i, 'lg-eca'],
  ['Legislação', /ldb/i, 'lg-ldb'],
  ['Legislação', /bncc/i, 'lg-bncc'],
  ['Legislação', /lbi/i, 'lg-lbi'],
  ['Legislação', /política inclusiva/i, 'lg-pneepei'],
  ['Legislação', /pne/i, 'lg-pne'],
  ['Legislação', /alfabetiza/i, 'lg-pna'],
  ['Legislação', /aee/i, 'lg-aee'],
  ['Legislação', /afro|indígena/i, 'lg-afro'],
  ['Legislação', /15\.100/i, 'lg-celular'],

  ['Específicos', /alfabetiza|leitura e escrita/i, 'ce-alfabetizacao'],
  ['Específicos', /atualidades/i, 'ce-atualidades'],
  ['Específicos', /piaget|psicologia da aprendizagem/i, 'ce-piaget'],
  ['Específicos', /vygotsky|mediação/i, 'ce-vygotsky'],
  ['Específicos', /wallon/i, 'ce-wallon'],
  ['Específicos', /ausubel|skinner|teorias pedagógicas/i, 'ce-tendencias'],
  ['Específicos', /freire/i, 'ce-freire'],
  ['Específicos', /currículo/i, 'ce-curriculo'],
  ['Específicos', /avaliação|recuperação|didática/i, 'ce-avaliacao'],
  ['Específicos', /bncc|raciocínio|geometria/i, 'ce-bncc-ai'],
  ['Específicos', /desenvolvimento infantil|rcnei/i, 'ce-infantil'],
  ['Específicos', /inclusiva|tecnologia|formação/i, 'ce-tecnologia'],
  ['Específicos', /fundamentos|filosofia|história da educação|ensino no brasil/i, 'ce-fundamentos'],
  ['Específicos', /família|gestão|ppp/i, 'ce-ppp'],
  ['Específicos', /evasão|progressão/i, 'ce-progressao'],
  ['Específicos', /interdisciplinar|projetos/i, 'ce-projetos'],
  ['Específicos', /ludicidade/i, 'ce-brincar'],
  ['Específicos', /planejamento/i, 'ce-didatica'],
  ['Específicos', /taxonomia/i, 'ce-bloom'],
  ['Específicos', /tct|pcn/i, 'ce-pcn-tct'],
  ['Específicos', /socorros/i, 'ce-socorros'],
  ['Específicos', /suzano/i, 'ce-suzano'],
];

const PADRAO = { 'Português': 'pt-interpretacao', 'Matemática': 'mt-operacoes', 'Legislação': 'lg-ldb', 'Específicos': 'ce-tendencias' };

const busca = (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q);
const L = (titulo, url) => ({ titulo, url: url || busca(titulo + ' resumo') });

// Leituras sugeridas por tema. Sem URL = abre uma busca pelo título.
const LEITURAS = {
  'pt-ortografia': [L('Vocabulário Ortográfico da Língua Portuguesa (VOLP) · ABL', 'https://www.academia.org.br/nossa-lingua/busca-no-vocabulario')],

  'lg-cf': [L('Constituição Federal · arts. 205 a 214 (Planalto)', 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm#art205')],
  'lg-eca': [L('ECA · Lei 8.069/1990, arts. 53 a 59 (Planalto)', 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm')],
  'lg-ldb': [L('LDB · Lei 9.394/1996, texto compilado (Planalto)', 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm')],
  'lg-bncc': [L('BNCC · Ministério da Educação', 'https://basenacionalcomum.mec.gov.br/a-base')],
  'lg-lbi': [L('LBI · Lei 13.146/2015, cap. IV (Planalto)', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm')],
  'lg-pneepei': [L('Decreto 12.686/2025 · Política Nacional de Educação Especial Inclusiva', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12686.htm')],
  'lg-pne': [L('PNE · Lei 15.388/2026, texto atualizado (Câmara)', 'https://www2.camara.leg.br/legin/fed/lei/2026/lei-15388-14-abril-2026-798950-normaatualizada-pl.html')],
  'lg-pna': [
    L('PNA · Decreto 9.765/2019 (texto histórico)', 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/decreto/d9765impressao.htm'),
    L('Compromisso Nacional Criança Alfabetizada · Decreto 11.556/2023', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11556.htm'),
  ],
  'lg-aee': [L('Resolução CNE/CEB 4/2009 · MEC (PDF)', 'http://portal.mec.gov.br/dmdocuments/rceb004_09.pdf')],
  'lg-afro': [
    L('Lei 10.639/2003 (Planalto)', 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.639.htm'),
    L('Lei 11.645/2008 (Planalto)', 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11645.htm'),
  ],
  'lg-celular': [L('Lei 15.100/2025 e exceções · Câmara dos Deputados', 'https://www.camara.leg.br/noticias/1126717-sancionada-lei-que-proibe-o-uso-de-celular-em-escolas')],

  'ce-fundamentos': [L('Saviani · História das ideias pedagógicas no Brasil')],
  'ce-piaget': [L('La Taille, Oliveira e Dantas · Piaget, Vygotsky, Wallon: teorias psicogenéticas em discussão')],
  'ce-vygotsky': [L('Vygotsky · A formação social da mente (cap. 6, zona de desenvolvimento proximal)')],
  'ce-wallon': [L('Izabel Galvão · Henri Wallon: uma concepção dialética do desenvolvimento infantil')],
  'ce-tendencias': [L('Libâneo · Democratização da escola pública (cap. 1, tendências pedagógicas)'), L('Saviani · Escola e democracia')],
  'ce-freire': [L('Paulo Freire · Pedagogia da autonomia'), L('Perrenoud · Dez novas competências para ensinar')],
  'ce-didatica': [L('Libâneo · Didática (planejamento escolar)'), L('Zabala · A prática educativa: como ensinar')],
  'ce-bloom': [L('Taxonomia de Bloom revisada · objetivos e verbos')],
  'ce-ppp': [L('Ilma Veiga · Projeto político-pedagógico da escola'), L('Vitor Paro · Gestão democrática da escola pública')],
  'ce-avaliacao': [L('Luckesi · Avaliação da aprendizagem escolar'), L('Jussara Hoffmann · Avaliação mediadora')],
  'ce-progressao': [L('Progressão continuada e ciclos · LDB art. 32 §2º', 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm')],
  'ce-curriculo': [L('Tomaz Tadeu da Silva · Documentos de identidade: uma introdução às teorias do currículo')],
  'ce-projetos': [L('Hernández e Ventura · A organização do currículo por projetos de trabalho'), L('Ivani Fazenda · Interdisciplinaridade')],
  'ce-pcn-tct': [L('MEC · Temas Contemporâneos Transversais na BNCC')],
  'ce-tecnologia': [L('José Moran · Novas tecnologias e mediação pedagógica')],
  'ce-alfabetizacao': [L('Magda Soares · Alfabetização e letramento'), L('Ferreiro e Teberosky · Psicogênese da língua escrita')],
  'ce-bncc-ai': [L('BNCC · Ensino Fundamental, Anos Iniciais', 'https://basenacionalcomum.mec.gov.br/a-base'), L('Constance Kamii · A criança e o número')],
  'ce-infantil': [L('RCNEI · Referencial Curricular Nacional para a Educação Infantil, vol. 1')],
  'ce-brincar': [L('Tizuko Kishimoto · Jogo, brinquedo, brincadeira e a educação')],
  'ce-socorros': [
    L('Lei Lucas · Lei 13.722/2018 (Planalto)', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13722.htm'),
    L('SAMU 192 · Ministério da Saúde', 'https://www.gov.br/saude/pt-br/composicao/saes/samu-192'),
  ],
  'ce-suzano': [
    L('Prefeitura de Suzano · história', 'https://suzano.sp.gov.br/cidade/historia/'),
    L('Câmara de Suzano · Lei Orgânica', 'https://www.camarasuzano.sp.gov.br/lei-organica/'),
  ],
  'ce-atualidades': [L('Inep · Indicador Criança Alfabetizada', 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/avaliacao-da-alfabetizacao/resultados')],
};

const porId = Object.fromEntries(todosItens.map((i) => [i.id, i]));

/** Tema das videoaulas + leituras para revisar o assunto de uma questão. */
export function estudoPara(q) {
  const regra = REGRAS.find(([g, re]) => g === q.group && re.test(q.topic));
  const item = porId[regra ? regra[2] : PADRAO[q.group]];
  const leituras = LEITURAS[item.id] || [L(`${item.titulo} · resumo e exercícios`)];
  return { item, leituras };
}
