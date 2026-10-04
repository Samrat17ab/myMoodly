import type { Post } from "../lib/types";

export const lonelinessFacts: Post = {
  slug: "loneliness-is-not-a-personal-failing",
  title: "Loneliness isn't a personal failing. Here's what the research says.",
  description:
    "Loneliness is common, it affects health as much as some well-known risks, and small, low-stakes contact helps more than people expect. What the evidence shows.",
  category: "Loneliness",
  publishedAt: "2026-10-04",
  author: "The myMoodly team",
  body: [
    {
      type: "p",
      text: "If you feel lonely, it's easy to read it as a verdict on you: not interesting enough, not likeable enough, too much or not enough. The research points somewhere kinder and more useful. Loneliness is extremely common, it isn't the same as being alone, and it behaves less like a character flaw and more like a signal.",
    },
    { type: "h2", text: "Lonely and alone aren't the same thing" },
    {
      type: "p",
      text: "Researchers separate **social isolation**, how much contact you actually have, from **loneliness**, the painful sense that your connections don't meet your needs. You can live alone and feel content, or sit in a full room, a busy office or a family dinner and feel completely unseen.",
    },
    {
      type: "p",
      text: "That distinction matters, because it means the fix isn't simply \"see more people.\" It's closer to finding contact that feels real, even in small amounts.",
    },
    { type: "h2", text: "It's far more common than it feels" },
    {
      type: "p",
      text: "In 2023 the U.S. Surgeon General issued an advisory calling loneliness and isolation an epidemic, noting that about half of adults in the United States report experiencing measurable levels of loneliness. The same year, the World Health Organization launched a Commission on Social Connection to treat loneliness as a global public health priority.",
    },
    {
      type: "p",
      text: "So if it feels like everyone else has their people sorted, that impression is probably wrong. Loneliness is hard to see from the outside, which is part of what makes it so isolating.",
    },
    { type: "h2", text: "Why health researchers take it seriously" },
    {
      type: "p",
      text: "A 2015 review that pooled data from 70 studies found that social isolation, loneliness and living alone were each linked to a higher risk of early death: roughly 29%, 26% and 32% higher, respectively. An earlier review of 148 studies found that people with stronger social relationships had about a 50% greater likelihood of survival over the study periods.",
    },
    {
      type: "p",
      text: "The Surgeon General's advisory compares the mortality impact of being socially disconnected to smoking up to 15 cigarettes a day. These are associations across large groups, not a forecast for any one person, but they explain why loneliness is now discussed alongside sleep, diet and exercise.",
    },
    {
      type: "quote",
      text: "Loneliness behaves less like a character flaw and more like a signal.",
    },
    { type: "h2", text: "A signal, not a sentence" },
    {
      type: "p",
      text: "The late neuroscientist John Cacioppo, who spent decades studying loneliness, argued that it works much like hunger or thirst. Hunger isn't a failure; it's your body telling you that you need food. Loneliness, in his account, is your mind telling you that you need connection.",
    },
    {
      type: "p",
      text: "The trouble is that long stretches of loneliness can make us more guarded. We start scanning for rejection, reading neutral moments as cold ones, and holding back, which makes connection harder still. Knowing that this loop exists doesn't break it on its own, but it can take some of the shame out of it.",
    },
    { type: "h2", text: "What tends to help" },
    {
      type: "p",
      text: "There's no single fix, but a few findings are surprisingly encouraging:",
    },
    {
      type: "ul",
      items: [
        "**Small contact counts.** In one study, people felt happier and more connected on days when they had more interactions with casual acquaintances, the barista or the neighbour, not just close friends.",
        "**Strangers are kinder than we predict.** People asked to talk to a stranger on their commute expected it to be awkward, then reported a more pleasant journey than those who kept to themselves.",
        "**Naming it helps.** Putting a feeling into words, even just to yourself, can make it easier to carry. We wrote about why in a separate post.",
        "**Regular beats intense.** A short, repeated point of contact often does more than one big effort you have to psych yourself up for.",
      ],
    },
    {
      type: "p",
      text: "None of this asks you to become someone else. It asks for small, low-stakes chances to be met where you are.",
    },
    {
      type: "callout",
      title: "If it's more than loneliness",
      text: "If loneliness has turned into feeling hopeless or unsafe, please reach out to a crisis line or your local emergency service now. You can find verified helplines at [findahelpline.com](https://findahelpline.com), and myMoodly's [help page](/help) lists support numbers.",
    },
  ],
  sources: [
    {
      label: "Office of the U.S. Surgeon General (2023). Our Epidemic of Loneliness and Isolation.",
      url: "https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf",
    },
    {
      label: "World Health Organization. Commission on Social Connection.",
      url: "https://www.who.int/groups/commission-on-social-connection",
    },
    {
      label:
        "Holt-Lunstad, J., Smith, T. B., Baker, M., Harris, T., & Stephenson, D. (2015). Loneliness and social isolation as risk factors for mortality: A meta-analytic review. Perspectives on Psychological Science, 10(2), 227-237.",
      url: "https://doi.org/10.1177/1745691614568352",
    },
    {
      label:
        "Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). Social relationships and mortality risk: A meta-analytic review. PLoS Medicine, 7(7), e1000316.",
      url: "https://doi.org/10.1371/journal.pmed.1000316",
    },
    {
      label:
        "Cacioppo, J. T., & Patrick, W. (2008). Loneliness: Human Nature and the Need for Social Connection. W. W. Norton.",
    },
    {
      label:
        "Sandstrom, G. M., & Dunn, E. W. (2014). Social interactions and well-being: The surprising power of weak ties. Personality and Social Psychology Bulletin, 40(7), 910-922.",
      url: "https://doi.org/10.1177/0146167214529799",
    },
    {
      label:
        "Epley, N., & Schroeder, J. (2014). Mistakenly seeking solitude. Journal of Experimental Psychology: General, 143(5), 1980-1999.",
      url: "https://doi.org/10.1037/a0037323",
    },
  ],
};
