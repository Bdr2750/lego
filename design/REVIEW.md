# Design Review

## Low-fidelity sketches

Look in img file

## List of taken considerations for sketches/design
1. **Mobile-first approach**  
   - Prioritized vertical scrolling layout  
   - Thumb-friendly tap targets  
   - Progressive disclosure of filters

2. **Information hierarchy**  
   - Price displayed most prominently  
   - Secondary details (comments, temp) in smaller text  
   - Color coding for quick scanning

3. **Accessibility**  
   - Minimum 4.5:1 contrast ratios  
   - Semantic HTML structure  
   - Keyboard navigable controls

## Main problem we are solving for
We help LEGO collectors overcome three key challenges:  
1. Difficulty comparing prices across multiple platforms  
2. Overwhelming number of deal options without smart filtering  
3. Lack of historical data to identify genuine bargains

## Measures of the success
| Success Metric         | Target      | Measurement Method          |
|------------------------|-------------|------------------------------|
| Time to find deal      | < 45 seconds| Session recordings           |
| Filter usage rate      | > 70%       | Analytics tracking           |
| Return visits/week     | ≥ 3         | Auth system analytics        |
| Error recovery success | 90%         | Usability testing observations |

## List of visual aspects convictions
1. **Color System**  
   - Red (#e74c3c) for discounts/urgent deals  
   - Green (#2ecc71) for "good price" thresholds  
   - Blue (#3498db) for interactive elements  
   *Rationale: High contrast for quick scanning while maintaining accessibility*

2. **Typography**  
   - Roboto (16px base) for readability  
   - Bold weights for prices/important numbers  
   *Rationale: Clean sans-serif maintains data-heavy display clarity*

3. **Spacing System**  
   - 8px baseline grid  
   - 16px between cards  
   *Rationale: Consistent rhythm reduces visual fatigue*

4. **Visual Hierarchy**  
   - Price 2x larger than other text  
   - Icons paired with labels  
   *Rationale: Guides eye flow to key decision factors*

## List of interaction patterns convictions
1. **Sticky Filters**  
   - Filters persist during scroll  
   - Visual counter shows active filters  
   *Why: Reduces repetitive scrolling for refinement*

2. **Smart Defaults**  
   - Default sort: "Best Value" score  
   - Default view: 6 items  
   *Why: 80% users never change initial settings*

3. **Undo Pattern**  
   - Toast notification after favorite removal  
   - 7-second undo window  
   *Why: Prevents accidental data loss*

4. **Progressive Disclosure**  
   - Basic filters visible by default  
   - Advanced filters behind "More Options"  
   *Why: Reduces novice user overwhelm*
