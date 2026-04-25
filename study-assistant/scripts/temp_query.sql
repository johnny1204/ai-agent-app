INSERT INTO questions (question, options, correctAnswer, explanation, category, exam_year, exam_season, question_number) VALUES ('When logical expressions P and Q are both true, which of the following logical expressions is always true, regardless of the truth value of logical expression R? Here, "—" represents negation, "V" represents logical OR, "∧" represents logical AND, and "→" represents implication (an operation that is false only when "true → false").', '["((P→Q)∧(Q→P))→(R→Q)","((P→Q)∧(Q→P))→(Q→R)","((P→Q)V(Q→P))→(R→Q)","((P→Q)V(Q→P))→(Q→R)"]', 3, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 1),('In an algorithm that approximates the value of x for which f(x) = 0 within the interval 0 ≤ x ≤ 1, where f(x) is a monotonically increasing continuous function satisfying f(0) < 0 ≤ f(1), how many times is step (2) executed?

[Algorithm]
(1) Set x0 ← 0, x1 ← 1.
(2) Set x ← (x0 + x1) / 2.
(3) If x1 - x0 < 0.001, then terminate with x as the approximate value.
(4) If f(x) ≥ 0, then set x1 ← x; otherwise, set x0 ← x.
(5) Go back to (2).', '["10","20","100","1,000"]', 0, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 2),('In the process of machine learning in AI, which of the following is the most appropriate method to resolve suspected overfitting?', '["To achieve the same accuracy as during training, use training data as test data.","To improve accuracy, process the original training data and increase the amount of training data.","To get closer to the predicted results, make the model more complex.","To be able to predict for more unknown data, reduce generalization performance."]', 1, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 3),('In an embedded system that requires real-time performance, which of the following is the most appropriate method for real-time response to system input?', '["Respond without using an OS.","Respond within a specified time limit.","Respond while maintaining the order of input.","Record the input time and respond."]', 1, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 4),('There are data items A, B, C that are input in that order. If each data item can be inserted into and removed from a stack exactly once, how many different output sequences are possible?
```mermaid
graph TD
    subgraph Input
        A
        B
        C
    end
    Input --> Stack
    Stack --> Output
```
[図解説: データA, B, Cがこの順で入力され、スタックを介して出力されることを示す。]', '["3","4","5","6"]', 2, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 5),('Which of the following is the correct AVL tree after sequentially adding two elements, 1 and 0, to the binary search tree shown in the figure?
```mermaid
graph TD
    5 --> 3
    5 --> 7
    3 --> 2
    3 --> 4
    7 --> 6
```
[図解説: 根が5で、左の子が3、右の子が7。3の左の子が2、右の子が4。7の左の子が6である2分探索木。]', '["```mermaid\ngraph TD\n    5 --> 3\n    5 --> 7\n    3 --> 1\n    3 --> 4\n    7 --> 6\n    1 --> 0\n    1 --> 2\n```\n[図解説: 根が5。左の子が3、右の子が7。3の左の子が1、右の子が4。7の左の子が6。1の左の子が0、右の子が2である2分探索木。]","```mermaid\ngraph TD\n    4 --> 2\n    4 --> 6\n    2 --> 1\n    2 --> 3\n    6 --> 5\n    6 --> 7\n    1 --> 0\n```\n[図解説: 根が4。左の子が2、右の子が6。2の左の子が1、右の子が3。6の左の子が5、右の子が7。1の左の子が0である2分探索木。]","```mermaid\ngraph TD\n    5 --> 3\n    5 --> 7\n    3 --> 1\n    3 --> 4\n    7 --> 6\n    1 --> 0\n    1 --> 2\n```\n[図解説: 根が5。左の子が3、右の子が7。3の左の子が1、右の子が4。7の左の子が6。1の左の子が0、右の子が2である2分探索木。]","```mermaid\ngraph TD\n    5 --> 3\n    5 --> 6\n    3 --> 1\n    3 --> 4\n    6 --> 7\n    1 --> 0\n    1 --> 2\n```\n[図解説: 根が5。左の子が3、右の子が6。3の左の子が1、右の子が4。6の左の子が7。1の左の子が0、右の子が2である2分探索木。]"]', 2, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 6),('fact(n) returns the factorial of n for a non-negative integer n. Which of the following is the recursive definition of fact(n)?', '["if n=0 then return 0 else return n×fact (n-1)","if n=0 then return 0 else return n×fact (n+1)","if n=0 then return 1 else return n×fact (n-1)","if n=0 then return 1 else return n×fact (n+1)"]', 2, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 7),('There are computers A and B that have the same instruction set. Their CPU clock cycles and CPI (Cycles Per Instruction) when executing a certain program are as shown in the table. When executing that program, how many times longer is the processing time of computer A compared to computer B?

|             | CPU Clock Cycle | CPI |
| :---------- | :-------------- | :-- |
| Computer A  | 1 nanosecond    | 4.0 |
| Computer B  | 4 nanoseconds   | 0.5 |
[図解説: コンピュータAとBのCPUクロック周期とCPIを示す表。]', '["1/32","1/2","2","8"]', 2, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 8),('Which of the following is an appropriate description of a DMA controller?', '["Performs multiply-accumulate operations, which take time on an MPU, at high speed.","Provides memory management functions such as virtual memory and memory protection.","Has a counter register that counts in synchronization with the operating clock, thereby keeping track of elapsed time.","Performs data transfer between memory and I/O devices, or between memory and memory, without involving the MPU."]', 3, '解説の生成に失敗しました。', '基礎理論', 2025, '秋期', 9),('Which of the following is an appropriate characteristic of object storage?', '["Objects are assigned unique identifiers and accessed using these identifiers.","When updating the content of an object, it performs an overwrite update.","To achieve wide-area distribution, it is necessary to set up remote storage and synchronization points for synchronization.","Storage has a hierarchical structure using the concept of directories."]', 0, '解説の生成に失敗しました。', 'データベース', 2025, '秋期', 10);