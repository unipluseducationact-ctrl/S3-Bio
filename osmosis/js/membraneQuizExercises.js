/**
 * True/False and fill-in-the-blank items from course PDF concept checks
 * (Membrane — all topics with introductory exercises).
 */

const TF_OPTS = [
  { key: "T", text: "True", textZh: "正確" },
  { key: "F", text: "False", textZh: "錯誤" },
];

const T = (value) => ({ type: "text", value });
const B = (accept) => ({ type: "blank", accept });

function fillLine(...segments) {
  return { segments };
}

function tf(id, section, stem, answer, hint, stemZh = "") {
  return {
    id,
    format: "tf",
    section,
    difficulty: "Foundation",
    stem,
    stemZh: stemZh || undefined,
    options: TF_OPTS,
    answer,
    hint,
  };
}

function fill(id, section, stem, lines, hint, wordBank = []) {
  return {
    id,
    format: "fill",
    section,
    difficulty: "Foundation",
    stem,
    wordBank,
    lines,
    hint,
  };
}

export const MEMBRANE_QUIZ_EXERCISES = [
  // —— Fluid mosaic T/F ——
  tf(
    "fm-tf-1",
    "fluid-mosaic",
    "The cell membrane is made up of a rigid structure to provide support.",
    "F",
    "The membrane is flexible and dynamic, not rigid."
  ),
  tf(
    "fm-tf-2",
    "fluid-mosaic",
    "Small, non-polar molecules like oxygen can diffuse through the phospholipid bilayer.",
    "T",
    "Non-polar molecules are lipid-soluble and cross the bilayer directly."
  ),
  tf(
    "fm-tf-3",
    "fluid-mosaic",
    "Carrier proteins are responsible for transporting small, non-polar molecules.",
    "F",
    "Carriers transport large or charged molecules that cannot cross the bilayer alone."
  ),
  tf(
    "fm-tf-4",
    "fluid-mosaic",
    "The Fluid Mosaic Model describes the cell membrane as a flexible and dynamic structure.",
    "T",
    "Fluidity and mosaic arrangement are key properties."
  ),
  tf(
    "fm-tf-5",
    "fluid-mosaic",
    "Polar molecules can pass through the phospholipid bilayer without assistance.",
    "F",
    "Polar and charged species need channel or carrier proteins."
  ),

  fill(
    "fm-fill",
    "fluid-mosaic",
    "Fill in the blanks — fluid mosaic & permeability",
    [
      fillLine(
        T("1. The "),
        B(["phospholipid bilayer", "磷脂雙層"]),
        T(" forms the basic structure of the cell membrane.")
      ),
      fillLine(
        T("2. Molecules that are "),
        B(["hydrophilic", "親水性", "親水"]),
        T(" interact with water and are polar.")
      ),
      fillLine(
        T("3. Molecules that are "),
        B(["hydrophobic", "疏水性", "疏水"]),
        T(" do not dissolve in water and are non-polar.")
      ),
      fillLine(
        T("4. "),
        B(["proteins", "蛋白質"]),
        T(" are embedded in the cell membrane to aid in the transport of certain molecules.")
      ),
      fillLine(
        T("5. The property of "),
        B(["differential permeability", "selective permeability", "差異滲透性"]),
        T(" allows the cell membrane to control what enters and exits the cell.")
      ),
    ],
    "Use terms from the word bank: phospholipid bilayer, hydrophilic, hydrophobic, proteins, differential permeability.",
    [
      "phospholipid bilayer",
      "hydrophilic",
      "hydrophobic",
      "proteins",
      "differential permeability",
    ]
  ),

  // —— Phospholipid & proteins T/F ——
  tf(
    "pl-tf-1",
    "phospholipid",
    "The phosphate group in a phospholipid is hydrophobic.",
    "F",
    "The phosphate group (with glycerol) forms the hydrophilic head."
  ),
  tf(
    "pl-tf-2",
    "phospholipid",
    "Membrane proteins are embedded in a mosaic pattern in the bilayer.",
    "T",
    "Proteins are scattered among phospholipids like tiles in a mosaic."
  ),
  tf(
    "pl-tf-3",
    "phospholipid",
    "Organic solvents dissolve the lipid bilayer and denature proteins.",
    "T",
    "Solvents such as ethanol disrupt lipid–protein interactions."
  ),
  tf(
    "pl-tf-4",
    "phospholipid",
    "Channel proteins transport substances by changing shape.",
    "F",
    "Channels provide open pores; carriers change shape."
  ),
  tf(
    "pl-tf-5",
    "phospholipid",
    "Glycoproteins in the membrane act as antigens for cell identification.",
    "T",
    "Glycoproteins act as cell “ID cards” for recognition."
  ),

  fill(
    "pl-fill",
    "phospholipid",
    "Fill in the blanks — phospholipid & membrane proteins",
    [
      fillLine(
        T("1. The "),
        B(["phospholipid bilayer", "磷脂雙層"]),
        T(" forms the basic structure of the cell membrane.")
      ),
      fillLine(T("2. The fatty acid tails of phospholipids are "), B(["hydrophobic", "疏水"]), T(".")),
      fillLine(T("3. The phosphate group in a phospholipid is "), B(["hydrophilic", "親水"]), T(".")),
      fillLine(T("4. "), B(["enzymes", "酶"]), T(" speed up chemical reactions in the membrane.")),
      fillLine(
        T("5. "),
        B(["receptor proteins", "receptor protein", "受體蛋白"]),
        T(" bind to specific chemical messengers to regulate cell activities.")
      ),
      fillLine(
        T("6. "),
        B(["glycoproteins", "glycoprotein", "糖蛋白"]),
        T(' act as "ID cards" for cell identification.')
      ),
      fillLine(
        T("7. "),
        B(["detergents", "清潔劑"]),
        T(" can dissolve the lipid bilayer by breaking protein–lipid interactions.")
      ),
    ],
    "Word bank: enzymes, receptor proteins, hydrophobic, glycoproteins, phospholipid bilayer, detergents, hydrophilic.",
    [
      "enzymes",
      "receptor proteins",
      "hydrophobic",
      "glycoproteins",
      "phospholipid bilayer",
      "detergents",
      "hydrophilic",
    ]
  ),

  // —— Osmosis T/F (20) ——
  tf("os-tf-1", "osmosis", "Osmosis requires energy input.", "F", "Osmosis is passive — no metabolic energy required."),
  tf(
    "os-tf-2",
    "osmosis",
    "Water moves from regions of high to low water potential during osmosis.",
    "T",
    "Net water movement is down the water potential gradient."
  ),
  tf(
    "os-tf-3",
    "osmosis",
    "A differentially permeable membrane is necessary for osmosis.",
    "T",
    "The membrane must allow water but restrict many solutes."
  ),
  tf(
    "os-tf-4",
    "osmosis",
    "Solute particles move across the membrane during osmosis.",
    "F",
    "Osmosis is the net movement of water, not solute."
  ),
  tf("os-tf-5", "osmosis", "Osmosis is considered a passive process.", "T", "No ATP is used for osmosis itself."),
  tf(
    "os-tf-6",
    "osmosis",
    "A region with higher solute concentration has higher water potential.",
    "F",
    "More solute lowers water potential (ψ becomes more negative)."
  ),
  tf(
    "os-tf-7",
    "osmosis",
    "Water potential is higher in pure water than in a sucrose solution.",
    "T",
    "Pure water has the highest ψ (reference ≈ 0)."
  ),
  tf(
    "os-tf-8",
    "osmosis",
    "Osmosis can occur without a water potential difference.",
    "F",
    "A ψ gradient drives net movement until equilibrium."
  ),
  tf(
    "os-tf-9",
    "osmosis",
    "The presence of solute decreases water potential.",
    "T",
    "Dissolved solute lowers ψ."
  ),
  tf(
    "os-tf-10",
    "osmosis",
    "Water moves from dilute to concentrated solutions in osmosis.",
    "T",
    "Water moves toward the solution with lower ψ (usually higher solute)."
  ),
  tf(
    "os-tf-11",
    "osmosis",
    "In osmosis, water moves towards the region with lower solute concentration.",
    "F",
    "Water moves toward higher solute concentration (lower ψ)."
  ),
  tf(
    "os-tf-12",
    "osmosis",
    "The net movement of water in osmosis is from low to high solute concentration.",
    "F",
    "Net water moves from high ψ to low ψ (often dilute → concentrated)."
  ),
  tf(
    "os-tf-13",
    "osmosis",
    "Osmosis stops when there is no water potential difference.",
    "T",
    "At equilibrium, net movement of water is zero."
  ),
  tf(
    "os-tf-14",
    "osmosis",
    "A higher solute concentration results in a more negative water potential.",
    "T",
    "ψ decreases as solute concentration increases."
  ),
  tf(
    "os-tf-15",
    "osmosis",
    "Osmosis occurs only in plant cells.",
    "F",
    "Osmosis occurs in both plant and animal cells."
  ),
  tf(
    "os-tf-16",
    "osmosis",
    "The presence of a solute increases the water potential.",
    "F",
    "Solute lowers water potential."
  ),
  tf(
    "os-tf-17",
    "osmosis",
    "Water potential is equal in all solutions.",
    "F",
    "ψ depends on solute concentration and pressure."
  ),
  tf(
    "os-tf-18",
    "osmosis",
    "Osmosis cannot occur without a membrane.",
    "T",
    "A differentially permeable membrane is required."
  ),
  tf(
    "os-tf-19",
    "osmosis",
    "Solute concentration does not affect osmosis.",
    "F",
    "Solute concentration determines water potential and driving force."
  ),
  tf(
    "os-tf-20",
    "osmosis",
    "Osmosis involves the movement of solute particles.",
    "F",
    "Only water moves net-wise in osmosis."
  ),

  fill(
    "os-fill",
    "osmosis",
    "Fill in the blanks — osmosis",
    [
      fillLine(
        T("1. "),
        B(["osmosis", "滲透作用"]),
        T(" is the process where water moves across a differentially permeable membrane.")
      ),
      fillLine(
        T("2. The "),
        B(["water potential", "solute concentration", "水勢", "溶質濃度"]),
        T(" difference drives the movement of water in osmosis.")
      ),
      fillLine(T("3. Osmosis is a "), B(["passive", "被動"]), T(" process and does not require energy.")),
      fillLine(
        T("4. A "),
        B([
          "differentially permeable",
          "differentially permeable membrane",
          "membrane",
          "差異滲透性",
          "膜",
        ]),
        T(" membrane is necessary for osmosis to occur.")
      ),
      fillLine(
        T("5. In osmosis, water moves from a region of low "),
        B(["water potential", "solute concentration", "水勢", "溶質濃度"]),
        T(" to high "),
        B(["water potential", "solute concentration", "水勢", "溶質濃度"]),
        T(".")
      ),
    ],
    "Word bank: solute concentration, passive, differentially permeable, water potential, osmosis.",
    ["solute concentration", "passive", "differentially permeable", "water potential", "osmosis"]
  ),

  // —— Active transport & phagocytosis T/F ——
  tf(
    "at-tf-1",
    "active-phago",
    "Active transport requires energy in the form of ATP.",
    "T",
    "Energy from respiration (ATP) powers active transport."
  ),
  tf(
    "at-tf-2",
    "active-phago",
    "Diffusion can move molecules against the concentration gradient.",
    "F",
    "Diffusion is down the concentration gradient only."
  ),
  tf(
    "at-tf-3",
    "active-phago",
    "Phagocytosis involves the engulfing of large particles by pseudopodia.",
    "T",
    "Pseudopodia surround and engulf large particles."
  ),
  tf(
    "at-tf-4",
    "active-phago",
    "Lysosomes release enzymes to catalyze digestion of the particle during phagocytosis.",
    "T",
    "Lysosome enzymes catalyze digestion of contents in the food vacuole."
  ),
  tf(
    "at-tf-5",
    "active-phago",
    "Active transport does not require carrier proteins.",
    "F",
    "Carrier proteins change shape to pump substances across the membrane."
  ),

  fill(
    "at-fill",
    "active-phago",
    "Fill in the blanks — active transport & phagocytosis",
    [
      fillLine(
        T("1. During phagocytosis, "),
        B(["pseudopodia", "偽足"]),
        T(" are formed to engulf particles.")
      ),
      fillLine(
        T("2. A "),
        B(["vacuole", "液泡"]),
        T(" encloses the engulfed particle during phagocytosis.")
      ),
      fillLine(
        T("3. The "),
        B(["lysosome", "溶酶體"]),
        T(" fuses with the vacuole to catalyze digestion of the engulfed particle.")
      ),
      fillLine(
        T("4. Active transport requires "),
        B(["energy", "能量"]),
        T(" from "),
        B(["respiration", "呼吸作用"]),
        T(", and thus would stop in presence of inhibitors like cyanide.")
      ),
      fillLine(
        T("5. "),
        B(["carrier proteins", "carrier protein", "載體蛋白"]),
        T(" are used to move molecules across the membrane during active transport.")
      ),
      fillLine(
        T("6. The digested products of phagocytosis "),
        B(["diffuse", "擴散"]),
        T(" into the cytoplasm.")
      ),
      fillLine(
        T("7. Phagocytosis is enabled by "),
        B(["membrane folding", "膜折疊"]),
        T(" of the cell membrane.")
      ),
    ],
    "Word bank: pseudopodia, lysosome, energy, vacuole, carrier protein, membrane folding, diffuse, respiration.",
    [
      "pseudopodia",
      "lysosome",
      "energy",
      "vacuole",
      "carrier protein",
      "membrane folding",
      "diffuse",
      "respiration",
    ]
  ),
];
