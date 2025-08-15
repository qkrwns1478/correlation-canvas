export const getParticle = (word: string, withFinalConsonant: string, withoutFinalConsonant: string): string => {
  if (!word || word.length === 0) return withoutFinalConsonant;
  
  const lastChar = word.charAt(word.length - 1);
  const lastCharCode = lastChar.charCodeAt(0);
  
  // 한글이 아닌 경우
  if (lastCharCode < 0xAC00 || lastCharCode > 0xD7A3) {
    const consonantEndings = ['L', 'N', 'R', 'M', 'K', 'T', 'P', 'S', 'X', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'Q', 'V', 'W', 'Y', 'Z'];
    const lastUpperChar = lastChar.toUpperCase();
    
    if (consonantEndings.includes(lastUpperChar)) {
      return withFinalConsonant;
    } else {
      return withoutFinalConsonant;
    }
  }
  
  // 한글인 경우
  const finalConsonantCode = (lastCharCode - 0xAC00) % 28;
  
  if (finalConsonantCode === 0) {
    return withoutFinalConsonant; // 받침 없음
  } else {
    return withFinalConsonant; // 받침 있음
  }
};
