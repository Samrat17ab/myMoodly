import type { Post } from "../lib/types";

export const namingFeelings: Post = {
  slug: "why-naming-a-feeling-helps",
  title: "Why naming a feeling makes it easier to carry",
  description:
    "Putting a feeling into words can turn down its intensity. What brain-imaging research found, and how to name feelings more precisely, starting with two questions.",
  category: "Feelings",
  publishedAt: "2026-10-04",
  author: "The myMoodly team",
  body: [
    {
      type: "p",
      text: "\"I'm fine\" is probably the most common answer to \"how are you?\", and often the least true. It's not always avoidance. Sometimes we genuinely don't have the words, or we have one blunt word, *bad* or *stressed*, standing in for something more specific.",
    },
    {
      type: "p",
      text: "It turns out that finding a better word does more than make conversation easier. It can change how the feeling sits in your body.",
    },
    { type: "h2", text: "What happens when you put a feeling into words" },
    {
      type: "p",
      text: "In a 2007 study at UCLA, researchers showed people photos of faces with strong emotional expressions while scanning their brains. When participants simply looked at the faces, the amygdala, a region involved in detecting threat and emotional intensity, responded strongly. When they chose a word to label the emotion, such as *angry* or *scared*, amygdala activity dropped, and a region of the prefrontal cortex associated with regulating emotion became more active.",
    },
    {
      type: "p",
      text: "The researchers called this **affect labeling**. Naming the feeling seemed to put a little distance between the person and the emotion, without any deliberate effort to calm down.",
    },
    {
      type: "quote",
      text: "Naming a feeling doesn't make it disappear. It makes it something you can hold.",
    },
    { type: "h2", text: "Precise words help more than broad ones" },
    {
      type: "p",
      text: "Psychologists use the term **emotional granularity** for how finely someone tells their feelings apart. Someone with low granularity might say \"I feel bad\" about a dozen different states. Someone with high granularity might distinguish *disappointed* from *embarrassed* from *left out*.",
    },
    {
      type: "p",
      text: "A review of research on this skill found that people who make finer distinctions between negative emotions tend to cope better under stress, and are less likely to turn to unhelpful ways of numbing it. The precise word points toward what you actually need: *left out* suggests reaching out, *exhausted* suggests rest.",
    },
    { type: "h2", text: "Two questions that make it easier" },
    {
      type: "p",
      text: "If you're not sure what you're feeling, start with two simpler questions. Psychologist James Russell proposed in 1980 that most feelings can be placed along two dimensions:",
    },
    {
      type: "ol",
      items: [
        "**How much energy is in it?** Restless, wired and buzzing at one end; flat, slow and drained at the other.",
        "**How pleasant or unpleasant is it?** Somewhere between good and bad, with plenty of room in the middle.",
      ],
    },
    {
      type: "p",
      text: "Answering those two narrows things down fast. High energy and unpleasant might be *anxious*, *frustrated* or *on edge*. Low energy and unpleasant might be *lonely*, *tired* or *down*. Low energy and pleasant might be *calm* or *content*. This is the idea behind the Mood Meter, developed at the Yale Center for Emotional Intelligence, and it's the map you use when you check in on myMoodly.",
    },
    { type: "h2", text: "Try it now" },
    {
      type: "p",
      text: "Take ten seconds. How much energy do you have right now, more or less than usual? Does it feel more pleasant or more unpleasant? Now pick one word that fits a bit better than \"fine.\" It doesn't have to be perfect. You can revise it.",
    },
    {
      type: "p",
      text: "That's the whole practice. Naming a feeling won't make a hard situation go away, but it often makes the feeling itself easier to hold, and easier to talk about with someone else.",
    },
  ],
  sources: [
    {
      label:
        "Lieberman, M. D., Eisenberger, N. I., Crockett, M. J., Tom, S. M., Pfeifer, J. H., & Way, B. M. (2007). Putting feelings into words: Affect labeling disrupts amygdala activity in response to affective stimuli. Psychological Science, 18(5), 421-428.",
      url: "https://doi.org/10.1111/j.1467-9280.2007.01916.x",
    },
    {
      label:
        "Kashdan, T. B., Barrett, L. F., & McKnight, P. E. (2015). Unpacking emotion differentiation: Transforming unpleasant experience by perceiving distinctions in negativity. Current Directions in Psychological Science, 24(1), 10-16.",
      url: "https://doi.org/10.1177/0963721414550708",
    },
    {
      label:
        "Russell, J. A. (1980). A circumplex model of affect. Journal of Personality and Social Psychology, 39(6), 1161-1178.",
      url: "https://doi.org/10.1037/h0077714",
    },
    {
      label: "Brackett, M. (2019). Permission to Feel. Celadon Books.",
    },
  ],
};
