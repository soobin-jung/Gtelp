import { useEffect, useMemo, useRef, useState } from "react";
import subjunctiveItems from "../data/grammar/subjunctive/category.json";
import subjunctiveQuestions from "../data/grammar/subjunctive/questions.json";
import tenseItems from "../data/grammar/tense/category.json";
import tenseQuestions from "../data/grammar/tense/questions.json";
import modalItems from "../data/grammar/modals/category.json";
import modalQuestions from "../data/grammar/modals/questions.json";
import conjunctionItems from "../data/grammar/conjunctions/category.json";
import conjunctionQuestions from "../data/grammar/conjunctions/questions.json";
import verbalItems from "../data/grammar/verbals/category.json";
import verbalQuestions from "../data/grammar/verbals/questions.json";
import verbalWords from "../data/grammar/verbals/words.json";
import readingPart1Questions from "../data/reading/part1/questions.json";

const readingFiles = import.meta.glob("../data/reading/reading_*.json");

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const BATCH_SIZE = 20;
const ADMIN_CONTACT_ENDPOINT = "/api/contact";
const TELEGRAM_ADMIN_URL = "";

const grammarConfigs = {
  "grammar-subjunctive": {
    label: "가정법",
    description: "가정법 핵심 유형을 선택하고 개념과 퀴즈를 함께 학습합니다.",
    items: subjunctiveItems,
    questions: subjunctiveQuestions,
    overviewKey: "subjunctive"
  },
  "grammar-tense": {
    label: "시제",
    description: "시제 핵심 유형별 개념과 랜덤 퀴즈를 학습합니다.",
    items: tenseItems,
    questions: tenseQuestions,
    overviewKey: "tense"
  },
  "grammar-modals": {
    label: "조동사",
    description: "조동사 기능별 개념과 랜덤 문제를 함께 학습합니다.",
    items: modalItems,
    questions: modalQuestions,
    overviewKey: "modals"
  },
  "grammar-conjunctions": {
    label: "연결어",
    description: "연결어 관계를 유형별로 정리하고 퀴즈로 확인합니다.",
    items: conjunctionItems,
    questions: conjunctionQuestions,
    overviewKey: "conjunctions"
  },
  "grammar-verbals": {
    label: "준동사",
    description: "to부정사와 동명사를 개념 표와 퀴즈로 함께 학습합니다.",
    items: verbalItems,
    questions: verbalQuestions,
    overviewKey: "verbals",
    conceptWords: verbalWords,
    categoryConceptEnabled: false,
    categoryButtonLabels: {
      1: "동명사",
      2: "to"
    }
  }
};

const grammarDefaultState = Object.fromEntries(
  Object.keys(grammarConfigs).map((pageKey) => [
    pageKey,
    {
      activeId: 0,
      tab: "concept",
      quizId: null,
      selectedAnswer: null,
      solveCount: 1
    }
  ])
);

const menuConfig = [
  {
    title: "문법",
    icon: "문",
    items: [
      { label: "가정법", page: "grammar-subjunctive" },
      { label: "시제", page: "grammar-tense" },
      { label: "준동사", page: "grammar-verbals" },
      { label: "should 생략", page: "grammar-should-omission" },
      { label: "조동사", page: "grammar-modals" },
      { label: "연결어", page: "grammar-conjunctions" }
    ]
  },
  {
    title: "독해",
    icon: "독",
    items: [
      { label: "단어", page: "reading-words" },
      { label: "part 1", page: "reading-part-1" },
      { label: "part 2", page: "reading-part-2" },
      { label: "part 3", page: "reading-part-3" },
      { label: "part 4", page: "reading-part-4" }
    ]
  },
  {
    title: "청취",
    icon: "청",
    items: [{ label: "x", page: "dashboard" }]
  }
];

const pageMeta = {
  dashboard: {
    title: "Dashboard",
    description: "학습 현황과 과목별 진행 상태를 한 번에 확인하세요."
  },
  "reading-words": {
    title: "독해 단어",
    description: "A부터 Z까지 분류된 독해 단어 목록을 확인할 수 있습니다."
  },
  "reading-part-1": {
    title: "독해 part 1",
    description: "독해 part 1 학습 화면입니다."
  },
  "reading-part-2": {
    title: "독해 part 2",
    description: "독해 part 2 학습 화면입니다."
  },
  "reading-part-3": {
    title: "독해 part 3",
    description: "독해 part 3 학습 화면입니다."
  },
  "reading-part-4": {
    title: "독해 part 4",
    description: "독해 part 4 학습 화면입니다."
  },
  "grammar-should-omission": {
    title: "문법 should 생략",
    description: "that절 당위 구문과 should 생략 패턴을 정리합니다."
  },
  ...Object.fromEntries(
    Object.entries(grammarConfigs).map(([page, config]) => [
      page,
      {
        title: `문법 ${config.label}`,
        description: config.description
      }
    ])
  )
};

const dashboardCards = [
  { icon: "문", title: "문법 학습 영역", value: "4+" },
  { icon: "독", title: "독해 단어 세트", value: "A-Z" },
  { icon: "퀴", title: "퀴즈 학습", value: "랜덤" },
  { icon: "학", title: "학습 방식", value: "개념 + 문제" }
];

const progressCards = [
  {
    title: "문법",
    width: "82%",
    description: "가정법, 시제, 조동사, 연결어 중심으로 구조화 완료"
  },
  {
    title: "독해",
    width: "64%",
    description: "A-Z 단어 학습과 잠금 학습 기능 구성 완료"
  },
  {
    title: "준동사",
    width: "34%",
    description: "to부정사 / 동명사 중심의 구조를 추가 설계 예정"
  }
];

const chartLabels = ["월", "화", "수", "목", "금", "토", "일"];
const chartSeries = [
  { label: "문법", color: "#2a7fff", values: [54, 58, 63, 72, 70, 78, 86] },
  { label: "독해", color: "#14b8a6", values: [38, 44, 49, 55, 61, 59, 68] },
  { label: "퀴즈", color: "#f97316", values: [22, 30, 35, 41, 48, 53, 60] }
];

const readingPartConfigs = {
  "reading-part-1": {
    title: "part 1",
    questions: readingPart1Questions,
    genre: "역사적 인물의 일대기 (Biographical Narrative)",
    summary:
      "과거의 위인이나 유명 인사, 과학자, 예술가, 탐험가 등의 삶을 다루는 전기문 유형입니다. 지텔프 레벨 2 독해에서 시간의 흐름을 따라 사건을 정리하는 능력이 중요하며, 지문은 보통 출생과 성장 배경에서 시작해 주요 업적과 시련, 말년과 사후 평가로 마무리됩니다.",
    structure: [
      "1단락: 출생 및 성장 배경",
      "2~3단락: 주요 업적, 전환점, 겪었던 시련",
      "마지막 단락: 말년, 영향력, 사후 평가"
    ],
    points: [
      "특정 시기나 연도에 어떤 일이 있었는지 묻는 문제가 자주 나옵니다.",
      "인물이 어떤 결정을 내린 이유나 특정 행동의 배경을 묻는 문제가 자주 출제됩니다.",
      "글 전체를 읽은 뒤 인물에 대한 최종 평가나 업적의 의미를 묻기도 합니다."
    ],
    tips: [
      "지문의 단락 순서와 문제 번호가 거의 일치하므로 문제를 먼저 읽고 키워드로 스캐닝하는 방식이 효과적입니다.",
      "연도, 이름, 지역명 같은 고유명사를 먼저 표시하면 정답 근거를 빠르게 찾을 수 있습니다.",
      "시간 순서대로 전개된다는 점을 이용하면 헷갈리는 보기도 쉽게 걸러낼 수 있습니다."
    ]
  },
  "reading-part-2": {
    title: "part 2",
    genre: "잡지 및 인터넷 기사 (Magazine/Web Article)",
    summary:
      "최신 트렌드, 사회적 이슈, 과학적 발견, 특정 연구 결과 등을 다루는 정보 전달형 기사입니다. 지텔프에서는 글의 전체 주제뿐 아니라 원인과 결과, 장단점, 연구 결과의 세부 내용을 함께 묻는 경우가 많아 체감 난도가 높은 편입니다.",
    structure: [
      "도입부: 특정 현상이나 사건, 연구 주제 소개",
      "중간 전개: 원인과 결과, 장단점, 배경 설명",
      "후반부: 세부 연구 결과, 영향, 시사점 정리"
    ],
    points: [
      "글의 메인 주제와 핵심 논지를 묻는 문제가 자주 나옵니다.",
      "특정 현상이 발생한 원인이나 연구 결과의 세부 내용을 물을 수 있습니다.",
      "보기와 지문의 사실 관계가 일치하는지 확인하는 문제가 자주 출제됩니다."
    ],
    tips: [
      "첫 번째 단락에 전체 주제가 분명하게 제시되는 경우가 많으므로 도입부를 꼼꼼히 읽는 것이 중요합니다.",
      "정보량이 많기 때문에 보기의 표현과 지문의 표현이 어떻게 바뀌었는지 paraphrasing을 확인해야 합니다.",
      "너무 넓거나 지나치게 단정적인 선택지는 오답일 가능성이 높습니다."
    ]
  },
  "reading-part-3": {
    title: "part 3",
    genre: "백과사전식 설명문 (Encyclopedia Article)",
    summary:
      "특정 동식물, 자연 현상, 과학 개념, 제도 등에 대해 객관적인 정보를 전달하는 설명문입니다. 지텔프에서는 정의와 특징, 서식지나 기능, 현재 상황 같은 정보가 질서 있게 제시되는 편이라 구조를 알고 읽으면 안정적으로 점수를 확보할 수 있습니다.",
    structure: [
      "도입부: 대상의 정의 또는 소개",
      "중간 전개: 생김새, 특징, 기능, 서식지나 생존 방식 설명",
      "후반부: 활용도, 영향, 현재 상황이나 보존 문제 정리"
    ],
    points: [
      "대상의 구체적인 특징이나 작동 방식, 생활 방식이 자주 문제로 나옵니다.",
      "서식 환경이나 특정 행동을 하는 이유를 묻는 문제가 자주 출제됩니다.",
      "글에 나온 객관적 사실을 정확히 구분하는 능력이 중요합니다."
    ],
    tips: [
      "학명이나 전문 용어가 나와도 정답을 고르는 데 결정적인 경우는 드물기 때문에 당황하지 않아도 됩니다.",
      "문맥상 그것이 먹이인지, 특징인지, 서식지인지 정도만 파악해도 풀이가 가능합니다.",
      "객관식 정답은 대부분 지문에 직접 근거가 있으므로 확대 해석보다 사실 확인이 우선입니다."
    ]
  },
  "reading-part-4": {
    title: "part 4",
    genre: "비즈니스 편지 및 이메일 (Business/Formal Letter)",
    summary:
      "발신자와 수신자가 분명한 실용문으로, 특정 목적을 가지고 상황 설명과 요청 사항을 전달하는 편지나 이메일 유형입니다. 지텔프에서는 글의 목적, 발신자가 처한 상황, 상대에게 요구하는 바를 파악하는 것이 핵심이며 다른 파트보다 내용이 직관적인 편이라 점수 확보용 파트로 활용하기 좋습니다.",
    structure: [
      "서두: 인사말과 편지를 쓰는 목적 제시",
      "중간 전개: 상황 설명, 문제 발생 배경, 필요한 정보 제공",
      "마무리: 요청 사항, 해결 방안 제안, 향후 계획"
    ],
    points: [
      "이 편지를 쓴 목적이 무엇인지 묻는 문제가 자주 나옵니다.",
      "발신자가 어떤 상황에 놓여 있는지 또는 어떤 문제를 겪는지 확인해야 합니다.",
      "수신자에게 무엇을 요청하는지, 다음 단계가 무엇인지가 핵심 출제 포인트입니다."
    ],
    tips: [
      "서두에서 편지의 목적을, 마지막 단락에서 요청 사항이나 향후 계획을 먼저 확인하면 문제 풀이가 빨라집니다.",
      "다른 파트보다 글 길이가 짧고 구조가 명확하므로 확실히 점수를 챙겨야 하는 파트입니다.",
      "누가 누구에게 왜 쓰는 글인지 먼저 정리하면 대부분의 문제를 안정적으로 풀 수 있습니다."
    ]
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState("grammar-subjunctive");
  const [activeMenuLabel, setActiveMenuLabel] = useState("가정법");
  const [openMenus, setOpenMenus] = useState(() =>
    Object.fromEntries(menuConfig.map((menu) => [menu.title, menu.title === "문법"]))
  );
  const [grammarUI, setGrammarUI] = useState(grammarDefaultState);
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isMeaningLocked, setIsMeaningLocked] = useState(false);
  const [revealedMeaningSeqs, setRevealedMeaningSeqs] = useState([]);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryStatus, setInquiryStatus] = useState("idle");
  const [inquiryError, setInquiryError] = useState("");
  const loadMoreRef = useRef(null);
  const tableScrollRef = useRef(null);

  const page = pageMeta[currentPage] ?? pageMeta.dashboard;
  const visibleWords = words.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setRevealedMeaningSeqs([]);
  }, [selectedLetter]);

  useEffect(() => {
    if (!isMeaningLocked) {
      setRevealedMeaningSeqs([]);
    }
  }, [isMeaningLocked]);

  useEffect(() => {
    const config = grammarConfigs[currentPage];
    if (!config) {
      return;
    }

    setGrammarUI((prev) => {
      const current = prev[currentPage];
      return {
        ...prev,
        [currentPage]: {
          ...current,
          selectedAnswer: null
        }
      };
    });
  }, [currentPage]);

  useEffect(() => {
    if (currentPage !== "reading-words") {
      return;
    }

    let ignore = false;

    async function loadWords() {
      setIsLoading(true);

      try {
        const filePath = `../data/reading/reading_${selectedLetter.toLowerCase()}.json`;
        const loader = readingFiles[filePath];

        if (!loader) {
          throw new Error("파일을 찾을 수 없습니다.");
        }

        const module = await loader();
        const items = Array.isArray(module.default) ? module.default : [];

        if (ignore) {
          return;
        }

        setWords(
          items.map((item, index) => ({
            seq: typeof item.seq === "number" ? item.seq : index + 1,
            word: item.word ?? "",
            meaning: item.meaning ?? "",
            synonym: Array.isArray(item.synonym) ? item.synonym : []
          }))
        );
      } catch {
        if (!ignore) {
          setWords([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadWords();

    return () => {
      ignore = true;
    };
  }, [currentPage, selectedLetter]);

  useEffect(() => {
    if (currentPage !== "reading-words" || isLoading || visibleCount >= words.length) {
      return;
    }

    const observerTarget = loadMoreRef.current;
    if (!observerTarget) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, words.length));
        }
      },
      { root: tableScrollRef.current, rootMargin: "200px 0px" }
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [currentPage, isLoading, visibleCount, words.length]);

  function toggleMenu(title) {
    setOpenMenus((prev) => {
      const isOpen = prev[title];
      return Object.fromEntries(
        menuConfig.map((menu) => [menu.title, menu.title === title ? !isOpen : false])
      );
    });
  }

  function navigateTo(item) {
    setCurrentPage(item.page);
    setActiveMenuLabel(item.label);
  }

  function updateGrammarPage(pageKey, updater) {
    setGrammarUI((prev) => {
      const nextSlice = updater(prev[pageKey]);
      return { ...prev, [pageKey]: nextSlice };
    });
  }

  function openInquiryModal() {
    setIsInquiryOpen(true);
    setInquiryStatus("idle");
    setInquiryError("");
  }

  function closeInquiryModal() {
    setIsInquiryOpen(false);
    setInquiryStatus("idle");
    setInquiryError("");
  }

  async function submitInquiry() {
    const trimmedMessage = inquiryMessage.trim();

    if (!trimmedMessage) {
      setInquiryStatus("error");
      setInquiryError("건의 내용을 입력해 주세요.");
      return;
    }

    if (!ADMIN_CONTACT_ENDPOINT) {
      setInquiryStatus("error");
      setInquiryError("관리자 건의 수신 경로가 아직 설정되지 않았습니다.");
      return;
    }

    setInquiryStatus("sending");
    setInquiryError("");

    try {
      const response = await fetch(ADMIN_CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page: currentPage,
          menu: activeMenuLabel,
          message: trimmedMessage,
          createdAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("failed");
      }

      setInquiryStatus("success");
      setInquiryMessage("");

      window.setTimeout(() => {
        closeInquiryModal();
      }, 900);
    } catch {
      setInquiryStatus("error");
      setInquiryError("건의 전송에 실패했습니다. 수신 경로를 다시 확인해 주세요.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-glow" />
        <div className="brand">
          <div className="brand-badge">G</div>
          <div className="brand-copy">
            <strong>Gtelp</strong>
            <span>Study dashboard</span>
          </div>
        </div>

        <nav className="menu-stack" aria-label="메인 메뉴">
          {menuConfig.map((menu) => (
            <section key={menu.title} className={`menu-group ${openMenus[menu.title] ? "open" : ""}`}>
              <button type="button" className="menu-title" onClick={() => toggleMenu(menu.title)}>
                <span className="menu-title-left">
                  <span className="menu-icon">{menu.icon}</span>
                  <span>{menu.title}</span>
                </span>
                <span className="menu-arrow">⌄</span>
              </button>

              {openMenus[menu.title] ? (
                <ul className="submenu">
                  {menu.items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        className={`submenu-link ${activeMenuLabel === item.label ? "active" : ""}`}
                        onClick={() => navigateTo(item)}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>G-TELP Workspace</strong>
          <span>Grammar, reading, and quiz flows in one place.</span>
        </div>

        <button type="button" className="sidebar-suggest-btn" onClick={openInquiryModal}>
          관리자한테 건의하기
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">Dashboard / Study Workspace</p>
            <h1>{page.title}</h1>
            <p className="topbar-description">{page.description}</p>
          </div>
          <div className="topbar-status">
            <div className="status-chip">Workspace</div>
            <div className="status-chip soft">{activeMenuLabel}</div>
          </div>
        </header>

        <div className="content">
          <div className="content-shell">
          {currentPage === "dashboard" ? (
            <DashboardPage />
          ) : null}

          {currentPage in grammarConfigs ? (
            <GrammarStudyPage
              title={grammarConfigs[currentPage].label}
              overviewKey={grammarConfigs[currentPage].overviewKey}
              items={grammarConfigs[currentPage].items}
              quizItems={grammarConfigs[currentPage].questions}
              conceptWords={grammarConfigs[currentPage].conceptWords}
              categoryConceptEnabled={
                grammarConfigs[currentPage].categoryConceptEnabled !== false
              }
              categoryButtonLabels={grammarConfigs[currentPage].categoryButtonLabels}
              state={grammarUI[currentPage]}
              onToggleCategory={(id) =>
                updateGrammarPage(currentPage, (slice) => {
                  const nextActiveId = slice.activeId === id ? null : id;
                  const canShowConcept =
                    nextActiveId === 0 ||
                    grammarConfigs[currentPage].categoryConceptEnabled !== false;

                  return {
                    ...slice,
                    activeId: nextActiveId,
                    tab: canShowConcept ? "concept" : "quiz",
                    quizId: pickRandomQuizId(
                      nextActiveId,
                      grammarConfigs[currentPage].questions
                    ),
                    selectedAnswer: null
                  };
                })
              }
              onChangeTab={(tab) =>
                updateGrammarPage(currentPage, (slice) => ({
                  ...slice,
                  tab
                }))
              }
              onSelectAnswer={(answerNumber) =>
                updateGrammarPage(currentPage, (slice) => {
                  if (slice.selectedAnswer !== null) {
                    return slice;
                  }
                  return {
                    ...slice,
                    selectedAnswer: answerNumber,
                    solveCount: slice.solveCount + 1
                  };
                })
              }
              onPickNextQuiz={() =>
                updateGrammarPage(currentPage, (slice) => ({
                  ...slice,
                  selectedAnswer: null,
                  quizId: pickRandomQuizId(
                    slice.activeId,
                    grammarConfigs[currentPage].questions,
                    slice.quizId
                  )
                }))
              }
            />
          ) : null}

          {currentPage === "reading-words" ? (
            <ReadingWordsPage
              selectedLetter={selectedLetter}
              onSelectLetter={setSelectedLetter}
              words={words}
              visibleWords={visibleWords}
              visibleCount={visibleCount}
              isLoading={isLoading}
              isMeaningLocked={isMeaningLocked}
              onToggleMeaningLock={() => setIsMeaningLocked((prev) => !prev)}
              revealedMeaningSeqs={revealedMeaningSeqs}
              onRevealMeaning={(seq) =>
                setRevealedMeaningSeqs((prev) => (prev.includes(seq) ? prev : [...prev, seq]))
              }
              loadMoreRef={loadMoreRef}
              tableScrollRef={tableScrollRef}
            />
          ) : null}

          {currentPage in readingPartConfigs ? (
            <ReadingPartPage config={readingPartConfigs[currentPage]} />
          ) : null}

          {currentPage === "grammar-should-omission" ? <ShouldOmissionPage /> : null}
          </div>
        </div>
      </main>

      {isInquiryOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeInquiryModal}>
          <section
            className="inquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-label="관리자 건의하기"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inquiry-modal-head">
              <div>
                <strong>관리자한테 건의하기</strong>
                <p>{activeMenuLabel} 화면 관련 내용을 바로 전송할 수 있습니다.</p>
              </div>
              <button type="button" className="inquiry-close-btn" onClick={closeInquiryModal}>
                ×
              </button>
            </div>

            <div className="inquiry-context-chip">
              현재 메뉴: <strong>{activeMenuLabel}</strong>
            </div>

            <textarea
              className="inquiry-textarea"
              placeholder="오류 내용이나 건의할 내용을 입력해 주세요."
              value={inquiryMessage}
              onChange={(event) => {
                setInquiryMessage(event.target.value);
                if (inquiryStatus === "error") {
                  setInquiryStatus("idle");
                  setInquiryError("");
                }
              }}
            />

            {inquiryError ? <p className="inquiry-feedback error">{inquiryError}</p> : null}
            {inquiryStatus === "success" ? (
              <p className="inquiry-feedback success">건의가 전송되었습니다.</p>
            ) : null}

            <div className="inquiry-actions">
              <button type="button" className="inquiry-secondary-btn" onClick={closeInquiryModal}>
                닫기
              </button>
              <button
                type="button"
                className="inquiry-primary-btn"
                onClick={submitInquiry}
                disabled={inquiryStatus === "sending"}
              >
                {inquiryStatus === "sending" ? "전송 중..." : "전송"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Today’s Workspace</p>
          <h2>문법과 독해를 한 화면에서 다루는 학습 대시보드</h2>
          <p>
            문법 단원은 `전체 / 개념 / 퀴즈` 흐름으로, 독해 단어는 `A-Z / 잠금 / 스크롤 학습`
            흐름으로 구성해 가독성과 반복 학습을 함께 잡는 방향으로 정리했습니다.
          </p>
        </div>
        <div className="hero-badge">학습 구조 리팩토링</div>
      </section>

      <section className="stats-grid">
        {dashboardCards.map((card) => (
          <article key={card.title} className="stat-card">
            <div className="stat-icon">{card.icon}</div>
            <div>
              <h3>{card.title}</h3>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>학습 흐름</h3>
            <p>문법, 독해, 퀴즈 영역이 어떻게 연결되는지 한 번에 볼 수 있습니다.</p>
          </div>
        </div>
        <SimpleChart />
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>진행 상태</h3>
            <p>현재 구조화가 어느 정도까지 정리되었는지 간단히 표시했습니다.</p>
          </div>
        </div>
        <div className="progress-grid">
          {progressCards.map((card) => (
            <article key={card.title} className="progress-card">
              <strong>{card.title}</strong>
              <div className="bar">
                <span style={{ width: card.width }} />
              </div>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function GrammarStudyPage({
  title,
  overviewKey,
  items,
  quizItems,
  conceptWords,
  categoryConceptEnabled = true,
  categoryButtonLabels,
  state,
  onToggleCategory,
  onChangeTab,
  onSelectAnswer,
  onPickNextQuiz
}) {
  const activeItem = items.find((item) => item.id === state.activeId) ?? null;
  const hasSelectedCategory = state.activeId === 0 || activeItem !== null;
  const shouldShowConceptTab = state.activeId === 0 || categoryConceptEnabled;
  const filteredQuizItems =
    state.activeId === 0
      ? quizItems
      : state.activeId === null
        ? []
        : quizItems.filter((item) => Number(item.category) === Number(state.activeId));

  const activeQuiz =
    filteredQuizItems.find((item) => item.id === state.quizId) ?? filteredQuizItems[0] ?? null;
  const answers = activeQuiz
    ? [activeQuiz.answer1, activeQuiz.answer2, activeQuiz.answer3, activeQuiz.answer4]
    : [];
  const isAnswered = state.selectedAnswer !== null && activeQuiz !== null;
  const isCorrect = isAnswered && state.selectedAnswer === activeQuiz.answer;
  const selectedAnswerText = isAnswered ? answers[(state.selectedAnswer ?? 1) - 1] ?? "" : "";
  const displayedQuizText = activeQuiz
    ? isAnswered
      ? activeQuiz.quiz.replace("_____", selectedAnswerText)
      : activeQuiz.quiz
    : "";

  return (
    <section className="study-panel">
      <div className="study-panel-top">
        <p className="eyebrow">Grammar Lab</p>
      </div>

      <div className="study-layout">
        <aside className="study-sidebar">
          <div className="category-row">
            <button
              type="button"
              className={`category-pill ${state.activeId === 0 ? "active" : ""}`}
              onClick={() => onToggleCategory(0)}
            >
              전체
            </button>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`category-pill ${state.activeId === item.id ? "active" : ""}`}
                onClick={() => onToggleCategory(item.id)}
              >
                {categoryButtonLabels?.[item.id] ?? item.title}
              </button>
            ))}
          </div>
        </aside>

        <div className="study-content">
          {hasSelectedCategory ? (
            <>
              <div className="tab-row">
                {shouldShowConceptTab ? (
                  <button
                    type="button"
                    className={`tab-pill ${state.tab === "concept" ? "active" : ""}`}
                    onClick={() => onChangeTab("concept")}
                  >
                    개념
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`tab-pill ${state.tab === "quiz" ? "active" : ""}`}
                  onClick={() => onChangeTab("quiz")}
                >
                  퀴즈
                </button>
              </div>

              {state.tab === "concept" ? (
                <article className="concept-panel">
                  {state.activeId === 0 ? (
                    <OverviewContent type={overviewKey} items={items} conceptWords={conceptWords} />
                  ) : (
                    <CategoryConceptCard item={activeItem} />
                  )}
                </article>
              ) : null}

              {state.tab === "quiz" ? (
                activeQuiz ? (
                  <section className="quiz-panel">
                    <div className="quiz-panel-head">
                      <div className="quiz-counter">{state.solveCount}</div>
                      <p className="quiz-question">{displayedQuizText}</p>
                    </div>

                    <div className="quiz-answer-list">
                      {answers.map((answerText, index) => {
                        const answerNumber = index + 1;
                        const answerState =
                          !isAnswered
                            ? ""
                            : answerNumber === activeQuiz.answer
                              ? "correct"
                              : answerNumber === state.selectedAnswer
                                ? "wrong"
                                : "";

                        return (
                          <button
                            key={`${activeQuiz.id}-${answerNumber}`}
                            type="button"
                            className={`quiz-answer-btn ${answerState}`}
                            onClick={() => onSelectAnswer(answerNumber)}
                            disabled={Boolean(isAnswered)}
                          >
                            <span className="quiz-answer-index">{answerNumber}</span>
                            <span>{answerText}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered ? (
                      <>
                        <div className={`quiz-result ${isCorrect ? "correct" : "wrong"}`}>
                          {isCorrect ? "정답입니다." : "오답입니다."}
                        </div>
                        <div className="quiz-commentary">{activeQuiz.commentary}</div>
                      </>
                    ) : null}

                    <div className="quiz-panel-footer">
                      <button type="button" className="quiz-next-btn" onClick={onPickNextQuiz}>
                        다른 문제
                      </button>
                    </div>
                  </section>
                ) : (
                  <EmptyState text="선택한 범위에 연결된 퀴즈가 없습니다." />
                )
              ) : null}
            </>
          ) : (
            <EmptyState text="카테고리를 선택하면 개념과 퀴즈를 바로 볼 수 있습니다." />
          )}
        </div>
      </div>
    </section>
  );
}

function HighlightedText({ text }) {
  const segments = String(text ?? "").split(/(`[^`]+`)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <mark key={`${segment}-${index}`} className="highlight-mark">
          {segment.slice(1, -1)}
        </mark>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function CategoryConceptCard({ item }) {
  const segments = String(item?.content ?? "")
    .split(/(?<=[.?!])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const summary = segments[0] ?? "";
  const details = segments.slice(1);

  return (
    <div className="category-concept">
      <div className="category-concept-hero">
        <div className="single-concept-badge">{item.id}</div>
        <div className="category-concept-head">
          <p className="category-concept-label">Category Concept</p>
          <h3>{item.title}</h3>
          <p className="category-concept-summary">
            <HighlightedText text={summary} />
          </p>
        </div>
      </div>

      {details.length ? (
        <div className="category-concept-grid">
          {details.map((detail, index) => (
            <article key={`${item.id}-${index}`} className="category-concept-card">
              <strong>Point {index + 1}</strong>
              <p>
                <HighlightedText text={detail} />
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OverviewContent({ type, items, conceptWords = [] }) {
  if (type === "verbals") {
    const ingWords = conceptWords.filter((item) => Number(item.category) === 1);
    const toWords = conceptWords.filter((item) => Number(item.category) === 2);
    const rowCount = Math.max(ingWords.length, toWords.length);
    const rows = Array.from({ length: rowCount }, (_, index) => ({
      to: toWords[index] ?? null,
      ing: ingWords[index] ?? null
    }));

    return (
      <div className="overview-panel">
        <section className="overview-block">
          <h3>준동사 전체 개념</h3>
          <p>
            지텔프 준동사는 <mark className="highlight-mark">목적어 자리에 오는 형태</mark>를
            빠르게 구분하는 것이 핵심입니다. 아래 표에서 왼쪽은{" "}
            <mark className="highlight-mark">to부정사</mark>, 오른쪽은{" "}
            <mark className="highlight-mark">동명사</mark>를 취하는 대표 동사를 정리했습니다.
          </p>
        </section>

        <section className="overview-block">
          <div className="verbals-table-wrap">
            <table className="verbals-table">
              <thead>
                <tr>
                  <th>to</th>
                  <th>ing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`verbal-row-${index + 1}`}>
                    <td>
                      {row.to ? (
                        <div className="verbal-word-card">
                          <strong>{row.to.word}</strong>
                          <span>{row.to.meaning}</span>
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {row.ing ? (
                        <div className="verbal-word-card">
                          <strong>{row.ing.word}</strong>
                          <span>{row.ing.meaning}</span>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  const titleMap = {
    subjunctive: {
      title: "가정법 전체 개요",
      summary:
        "가정법은 현실과 반대이거나 실현 가능성이 낮은 상황을 가정해서 말할 때 사용합니다. 핵심은 if절 시제와 주절 형태를 짝으로 기억하는 것입니다.",
      rules: [
        { title: "현재 사실 반대", text: "`if + 과거동사`, `would/could/might + 동사원형`" },
        { title: "과거 사실 반대", text: "`if + had p.p`, `would/could/might + have p.p`" },
        { title: "도치형", text: "`if`를 빼고 `Had / Were / Should`를 문장 맨 앞에 둡니다." },
        { title: "혼합 가정법", text: "과거 조건 + 현재 결과처럼 시제가 섞여 나오는 구조입니다." }
      ],
      tips: [
        "`be동사`는 가정법 과거에서 주어와 상관없이 `were`가 자주 나옵니다.",
        "`had p.p`가 보이면 가정법 과거완료인지 먼저 확인하면 빠릅니다.",
        "문장 앞에 `Had + 주어 + p.p`가 오면 `if` 생략 도치일 가능성이 큽니다.",
        "`now`, `today`가 결과절에 보이면 혼합 가정법 여부를 함께 보면 좋습니다."
      ]
    },
    tense: {
      title: "시제 전체 개요",
      summary:
        "시제 문제는 언제 일어나는 일인지 먼저 판단하고, 그다음 진행형인지 완료진행형인지 형태를 고르는 방식으로 접근하는 것이 효율적입니다.",
      rules: [
        { title: "현재진행", text: "`now`, `right now`, `currently`, `at the moment`가 대표 신호입니다." },
        { title: "과거진행", text: "`when`, `at that time`, `yesterday` 같은 과거 기준 표현과 함께 자주 나옵니다." },
        { title: "미래진행", text: "`tomorrow`, `next week` 등 미래 시점과 `will be ~ing`를 함께 봅니다." },
        { title: "완료진행", text: "`for`, `since`가 보이면 얼마나 계속되어 왔는지 묻는 구조인지 확인합니다." }
      ],
      tips: [
        "`currently`, `at the moment`는 현재진행을 강하게 시사합니다.",
        "`when + 과거동사`가 있으면 과거진행이 같이 나오는 경우가 많습니다.",
        "`for + 기간`, `since + 시점`은 완료진행형 출제 신호로 자주 등장합니다.",
        "`by`, `by the time`은 미래완료진행과 연결되는지 함께 확인하면 좋습니다."
      ]
    },
    modals: {
      title: "조동사 전체 개요",
      summary:
        "조동사 문제는 단어 뜻만 외우기보다 가능, 추측, 의무, 권고, 요청처럼 기능별로 나누어 보는 것이 중요합니다. 화자의 의도와 문장 분위기를 함께 읽는 연습이 필요합니다.",
      rules: [
        { title: "가능 / 능력", text: "`can`, `could`는 능력, 가능성, 정중한 요청과 자주 연결됩니다." },
        { title: "의지 / 미래", text: "`will`, `would`는 미래뿐 아니라 의지, 요청, 가정법 결과절에도 자주 나옵니다." },
        { title: "의무 / 강한 추측", text: "`must`, `should`는 해야 함, 마땅함, 강한 추론 의미를 중심으로 봅니다." },
        { title: "허가 / 약한 가능성", text: "`may`, `might`는 허가나 가능성 표현에서 자주 구분됩니다." }
      ],
      tips: [
        "`should`는 권고뿐 아니라 `suggest`, `demand`, `insist` 뒤 that절과도 자주 연결됩니다.",
        "`could`는 과거 능력뿐 아니라 현재의 조심스러운 가능성이나 정중한 표현으로도 등장합니다.",
        "`must`는 강한 의무와 강한 추측 두 가지 의미를 모두 확인해야 합니다.",
        "`may`보다 `might`가 가능성이 더 약한 느낌으로 출제되는 경우가 많습니다."
      ]
    },
    conjunctions: {
      title: "연결어 전체 개요",
      summary:
        "연결어 문제는 각 단어 뜻보다 문장 사이 관계를 먼저 읽는 것이 핵심입니다. 이유인지, 결과인지, 양보인지, 조건인지, 시간인지부터 정하면 정답 후보가 빠르게 좁혀집니다.",
      rules: [
        { title: "이유 / 원인", text: "`because`, `since`, `as`는 왜 그런지 이유를 설명할 때 자주 나옵니다." },
        { title: "결과 / 결론", text: "`therefore`, `thus`는 앞 문장을 바탕으로 결과나 결론을 이어줍니다." },
        { title: "양보 / 역접", text: "`although`, `even though`, `however`, `nevertheless`는 예상과 다른 흐름을 만듭니다." },
        { title: "조건 / 시간", text: "`if`, `unless`, `once`, `when`, `before`, `after`는 조건과 시점 구분이 중요합니다." }
      ],
      tips: [
        "`because`는 이유를 직접적으로 말할 때 가장 기본적인 연결어입니다.",
        "`however`, `therefore`, `moreover` 같은 접속부사는 문장 전체 흐름으로 판단해야 합니다.",
        "`although`와 `even though`는 양보, `because`는 이유이므로 의미 방향이 완전히 다릅니다.",
        "`unless`는 `if ... not` 의미와 가까워서 부정 조건으로 자주 출제됩니다."
      ]
    }
  };

  const overview = titleMap[type];

  return (
    <div className="overview-panel">
      <section className="overview-block">
        <h3>{overview.title}</h3>
        <p>
          <HighlightedText text={overview.summary} />
        </p>
      </section>

      <section className="overview-block">
        <h3>빠른 구분법</h3>
        <div className="overview-rule-grid">
          {overview.rules.map((rule) => (
            <article key={rule.title} className="overview-rule-card">
              <strong>{rule.title}</strong>
              <p>
                <HighlightedText text={rule.text} />
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-block">
        <h3>유형별 핵심</h3>
        <div className="overview-category-list">
          {items.map((item) => (
            <article key={item.id} className="overview-category-card">
              <div className="overview-category-index">{item.id}</div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.content}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-block">
        <h3>자주 보는 포인트</h3>
        <ul className="overview-tip-list">
          {overview.tips.map((tip) => (
            <li key={tip}>
              <HighlightedText text={tip} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function pickRandomQuizId(categoryId, quizSource, excludeId = null) {
  if (categoryId === null) {
    return null;
  }

  const pool =
    categoryId === 0
      ? quizSource
      : quizSource.filter((item) => Number(item.category) === Number(categoryId));

  if (!pool.length) {
    return null;
  }

  if (pool.length === 1) {
    return pool[0].id;
  }

  let nextId = excludeId;
  while (nextId === excludeId) {
    const index = Math.floor(Math.random() * pool.length);
    nextId = pool[index].id;
  }
  return nextId;
}

function ReadingWordsPage({
  selectedLetter,
  onSelectLetter,
  words,
  visibleWords,
  visibleCount,
  isLoading,
  isMeaningLocked,
  onToggleMeaningLock,
  revealedMeaningSeqs,
  onRevealMeaning,
  loadMoreRef,
  tableScrollRef
}) {
  const hasMore = visibleCount < words.length;

  return (
    <section className="study-panel">
      <div className="study-panel-top">
        <p className="eyebrow">Reading Vocabulary</p>
        <div className="study-chip">총 {words.length}개</div>
      </div>

      <div className="reading-toolbar">
        <button
          type="button"
          className={`lock-toggle ${isMeaningLocked ? "active" : ""}`}
          onClick={onToggleMeaningLock}
          aria-pressed={isMeaningLocked}
          aria-label="뜻 잠금 토글"
        >
          🔒
        </button>
        <div className="letter-row">
          {alphabet.map((letter) => (
            <button
              key={letter}
              type="button"
              className={`letter-pill ${selectedLetter === letter ? "active" : ""}`}
              onClick={() => onSelectLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <EmptyState text="데이터를 불러오는 중입니다." /> : null}
      {!isLoading && !words.length ? <EmptyState text="해당 알파벳에 등록된 단어가 없습니다." /> : null}

      {!isLoading && words.length ? (
        <div ref={tableScrollRef} className="table-card">
          <table className="words-table">
            <thead>
              <tr>
                <th>seq</th>
                <th>word</th>
                <th>뜻</th>
                <th>동의어</th>
              </tr>
            </thead>
            <tbody>
              {visibleWords.map((item) => {
                const isRevealed = revealedMeaningSeqs.includes(item.seq);
                const shouldMaskMeaning = isMeaningLocked && !isRevealed;

                return (
                  <tr key={`${selectedLetter}-${item.seq}`}>
                    <td className="seq-cell">{item.seq}</td>
                    <td className="word-cell">{item.word || "-"}</td>
                    <td className="meaning-cell">
                      {shouldMaskMeaning ? (
                        <button
                          type="button"
                          className="meaning-mask"
                          onClick={() => onRevealMeaning(item.seq)}
                          aria-label={`뜻 보기 ${item.seq}`}
                        >
                          <span className="meaning-mask-text">{item.meaning || "-"}</span>
                        </button>
                      ) : (
                        item.meaning || "-"
                      )}
                    </td>
                    <td>
                      <div className="synonym-list">
                        {item.synonym.length ? (
                          item.synonym.map((synonym) => (
                            <span key={`${item.seq}-${synonym}`} className="synonym-pill">
                              {synonym}
                            </span>
                          ))
                        ) : (
                          <span className="synonym-pill">없음</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {hasMore ? (
            <div ref={loadMoreRef} className="load-more-trigger">
              다음 데이터를 불러오는 중...
            </div>
          ) : (
            <div className="load-more-finish">모든 데이터를 표시했습니다.</div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ReadingPartPage({ config }) {
  const [tab, setTab] = useState("concept");
  const [passageIndex, setPassageIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const passages = config.questions ?? [];
  const passage = passages[passageIndex] ?? null;
  const quizItems = passage?.questions ?? [];

  useEffect(() => {
    setSelectedAnswers({});
    setPassageIndex(0);
  }, [config.title]);

  return (
    <section className="study-panel">
      <div className="study-panel-top">
        <p className="eyebrow">Reading Study</p>
      </div>

      <div className="reading-part-shell">
        <div className="tab-row">
          <button
            type="button"
            className={`tab-pill ${tab === "concept" ? "active" : ""}`}
            onClick={() => setTab("concept")}
          >
            개념
          </button>
          <button
            type="button"
            className={`tab-pill ${tab === "quiz" ? "active" : ""}`}
            onClick={() => setTab("quiz")}
          >
            퀴즈
          </button>
        </div>

        {tab === "concept" ? (
          <article className="concept-panel">
            <div className="overview-panel">
              <section className="overview-block">
                <h3>{config.title} 개념</h3>
                <p>{config.summary}</p>
              </section>

              <section className="overview-block">
                <h3>지문 유형</h3>
                <p>
                  <mark className="highlight-mark">{config.genre}</mark>
                </p>
              </section>

              <section className="overview-block">
                <h3>전개 방식</h3>
                <ul className="overview-tip-list">
                  {config.structure.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="overview-block">
                <h3>풀이 포인트</h3>
                <ul className="overview-tip-list">
                  {config.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>

              <section className="overview-block">
                <h3>지텔프 팁</h3>
                <ul className="overview-tip-list">
                  {config.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            </div>
          </article>
        ) : null}

        {tab === "quiz" ? (
          passage && quizItems.length ? (
            <div className="reading-quiz-layout">
              <article className="reading-passage-card reading-scroll-panel">
                <div className="reading-passage-head">
                  <strong>{config.title} Passage {passages.length > 1 ? `${passageIndex + 1} / ${passages.length}` : ""}</strong>
                  <span>{quizItems.length} Questions</span>
                </div>
                <p className="reading-passage-text">{passage.passage_text}</p>
              </article>

              <section className="reading-questions-shell">
                <div className="reading-questions-scroll reading-scroll-panel">
                <div className="reading-questions-grid">
                  {quizItems.map((question) => {
                    const answers = [question.answer1, question.answer2, question.answer3, question.answer4];
                    const selectedAnswer = selectedAnswers[question.q_id] ?? null;
                    const isAnswered = selectedAnswer !== null;
                    const isCorrect = isAnswered && selectedAnswer === question.answer;

                    return (
                      <article key={question.q_id} className="quiz-question-card">
                        <div className="quiz-panel-head">
                          <div className="quiz-counter">{question.q_id}</div>
                          <p className="quiz-question">{question.quiz}</p>
                        </div>

                        <div className="quiz-answer-list">
                          {answers.map((answerText, index) => {
                            const answerNumber = index + 1;
                            const answerState =
                              !isAnswered
                                ? ""
                                : answerNumber === question.answer
                                  ? "correct"
                                  : answerNumber === selectedAnswer
                                    ? "wrong"
                                    : "";

                            return (
                              <button
                                key={`${question.q_id}-${answerNumber}`}
                                type="button"
                                className={`quiz-answer-btn ${answerState}`}
                                onClick={() =>
                                  setSelectedAnswers((prev) =>
                                    prev[question.q_id]
                                      ? prev
                                      : { ...prev, [question.q_id]: answerNumber }
                                  )
                                }
                                disabled={Boolean(isAnswered)}
                              >
                                <span className="quiz-answer-index">{answerNumber}</span>
                                <span>{answerText}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered ? (
                          <>
                            <div className={`quiz-result ${isCorrect ? "correct" : "wrong"}`}>
                              {isCorrect ? "정답입니다." : "오답입니다."}
                            </div>
                            <div className="quiz-commentary">{question.commentary}</div>
                            {question.keywords?.length ? (
                              <div className="quiz-keywords">
                                <p className="quiz-keywords-label">핵심 단어</p>
                                <div className="quiz-keywords-list">
                                  {question.keywords.map((kw) => (
                                    <div key={kw.word} className="quiz-keyword-item">
                                      <strong>{kw.word}</strong>
                                      <span>{kw.meaning}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
                </div>

                <div className="quiz-panel-footer">
                  <button
                    type="button"
                    className="quiz-next-btn"
                    onClick={() => {
                      setPassageIndex((prev) => (prev + 1) % passages.length);
                      setSelectedAnswers({});
                    }}
                    disabled={passages.length <= 1}
                  >
                    다음 지문
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <EmptyState text="퀴즈 데이터가 준비되면 이 영역에 바로 연결됩니다." />
          )
        ) : null}
      </div>
    </section>
  );
}

function ShouldOmissionPage() {
  const [tab, setTab] = useState("concept");

  return (
    <section className="study-panel">
      <div className="study-panel-top">
        <p className="eyebrow">Grammar Lab</p>
      </div>

      <div className="reading-part-shell">
        <div className="tab-row">
          <button
            type="button"
            className={`tab-pill ${tab === "concept" ? "active" : ""}`}
            onClick={() => setTab("concept")}
          >
            개념
          </button>
          <button
            type="button"
            className={`tab-pill ${tab === "quiz" ? "active" : ""}`}
            onClick={() => setTab("quiz")}
          >
            퀴즈
          </button>
        </div>

        {tab === "concept" ? (
          <article className="concept-panel">
            <div className="overview-panel">
              <section className="overview-block">
                <h3>should 생략 개념</h3>
                <p>
                  지텔프에서 `should 생략`은 제안, 요구, 주장, 권고의 의미를 가진 동사나 형용사
                  뒤 `that절`에서 <mark className="highlight-mark">동사원형</mark>이 오는
                  패턴을 말합니다.
                </p>
              </section>

              <section className="overview-block">
                <h3>대표 트리거</h3>
                <ul className="overview-tip-list">
                  <li>
                    suggest, demand, insist, recommend, request, propose 같은 동사 뒤
                  </li>
                  <li>important, necessary, essential 같은 형용사 뒤</li>
                  <li>
                    that절 안에서는 <mark className="highlight-mark">주어와 상관없이
                    동사원형</mark>을 씁니다.
                  </li>
                </ul>
              </section>

              <section className="overview-block">
                <h3>지텔프 포인트</h3>
                <ul className="overview-tip-list">
                  <li>`should`가 실제로 보이지 않아도 의미상 당위 구문이면 동사원형이 정답일 수 있습니다.</li>
                  <li>현재시제처럼 보이는 `goes`, `is`, `does`를 고르게 만드는 함정에 주의해야 합니다.</li>
                  <li>가정법 현재와 묶어서 보는 것이 지텔프식 정리에 가장 효율적입니다.</li>
                </ul>
              </section>
            </div>
          </article>
        ) : null}

        {tab === "quiz" ? (
          <EmptyState text="퀴즈 데이터가 준비되면 이 영역에 바로 연결됩니다." />
        ) : null}
      </div>
    </section>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function SimpleChart() {
  const width = 1200;
  const height = 340;
  const padding = { top: 24, right: 24, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <div className="chart-card">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="주간 학습 흐름">
        {Array.from({ length: 6 }, (_, index) => {
          const y = padding.top + (chartHeight / 5) * index;
          return <line key={y} x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="chart-grid" />;
        })}

        <path
          d={`M ${padding.left} ${padding.top} L ${padding.left} ${height - padding.bottom} L ${
            width - padding.right
          } ${height - padding.bottom}`}
          className="chart-axis"
        />

        {chartLabels.map((label, index) => {
          const x = padding.left + (chartWidth / (chartLabels.length - 1)) * index;
          return (
            <text key={label} x={x} y={height - 14} textAnchor="middle" className="chart-label">
              {label}
            </text>
          );
        })}

        {chartSeries.map((series) => (
          <g key={series.label}>
            <polyline
              fill="none"
              stroke={series.color}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={series.values
                .map((value, index) => {
                  const x = padding.left + (chartWidth / (series.values.length - 1)) * index;
                  const y = padding.top + chartHeight - (value / 100) * chartHeight;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
            {series.values.map((value, index) => {
              const x = padding.left + (chartWidth / (series.values.length - 1)) * index;
              const y = padding.top + chartHeight - (value / 100) * chartHeight;
              return <circle key={`${series.label}-${index}`} cx={x} cy={y} r="4" fill="#fff" stroke={series.color} strokeWidth="3" />;
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default App;
