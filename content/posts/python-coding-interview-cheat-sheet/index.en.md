+++
date = '2025-12-12T14:52:10+09:00'
draft = false
title = 'Python Coding Interview Cheat Sheet'
tags = ['Python', 'Algorithms', 'Data Structures']
translationKey = 'python-coding-interview-cheat-sheet'
+++



This post summarizes the confusing points I encountered while preparing for Python coding interviews.

If you have any questions or see anything that needs correction, please feel free to leave a comment. Let's get started!

--------------------------------------------------------------------------------

## 1 Complexity

You need to write code that not only 'works' but also **'passes within the time limit.'**

{{< figure src="01_bigo_complexity_chart.png" caption="[그림 1] Big-O Complexity Chart: [bigocheatsheet.com](http://bigocheatsheet.com/)" >}}

--------------------------------------------------------------------------------

## 2 Standard Libraries

Utilizing Python's standard libraries can reduce both implementation time and execution time.

--------------------------------------------------------------------------------

### 2.1 `itertools`

Use this when you need to check all possible cases, such as permutations and combinations.

```py
import itertools

data = ["A", "B", "C", "D"]

# Permutations
perm = list(itertools.permutations(data, 3))

# Combinations
comb = list(itertools.combinations(data, 3))
```

--------------------------------------------------------------------------------

## 3 Sorting

--------------------------------------------------------------------------------

### 3.1 `Lambda`

Complex sorting conditions can be handled by passing a `lambda` and a 'tuple' to the `key` argument. Priorities are determined by the order of elements in the tuple.

#### 3.1.1 Tuples or Lists

```py
data = [
    ("Alex", 58, "DK"), 
    ("Charlie", 23, "US"), 
    ("Bree", 23, "CA"), 
    ("Alex", 28, "GE")
]

sorted_list = sorted(data, key=lambda x: (-x[1], x[0]))

# Result: [('Alex', 58, 'DK'), 
#          ('Alex', 28, 'GE'), 
#          ('Bree', 23, 'CA'), 
#          ('Charlie', 23, 'US')]
```

#### 3.1.2 Dictionaries

```py
data = [
    {"name": "Bree", "age": 23, "country": "CA"},
    {"name": "Alex", "age": 58, "country": "DK"},
    {"name": "Alex", "age": 28, "country": "GE"},
    {"name": "Charlie", "age": 45, "country": "US"},
]

sorted_list = sorted(data, key=lambda x: (x["age"], x["country"], x["name"]))

# Result: [{'name': 'Bree', 'age': 23, 'country': 'CA'},
#          {'name': 'Alex', 'age': 28, 'country': 'GE'},
#          {'name': 'Charlie', 'age': 45, 'country': 'US'},
#          {'name': 'Alex', 'age': 58, 'country': 'DK'}]
```

--------------------------------------------------------------------------------

## 4 Data Structures

--------------------------------------------------------------------------------

### 4.1 Deque

**Deque** stands for Double-Ended Queue, allowing data insertion and deletion from both ends in $O(1)$ time. **If you need Queue functionality, you must use Deque.**

#### 4.1.1 Usage

```py
import collections

dq = collections.deque()

# Add elements
dq.append(1)      # Result: deque([1])
dq.append(2)      # Result: deque([1, 2])
dq.appendleft(3)  # Result: deque([3, 1, 2])
dq.appendleft(4)  # Result: deque([4, 3, 1, 2])

# Remove elements
dq.pop()      # Result: deque([4, 3, 1])
dq.popleft()  # Result: deque([3, 1])
```

--------------------------------------------------------------------------------

### 4.2 Heap

A **Priority Queue** is an **interface (contract)** where 'regardless of the entry order, data with higher priority exits first.' A **Heap** is the binary tree-based **data structure** used to fulfill that contract.

While Python has `queue.PriorityQueue`, the `heapq` module is primarily used in coding tests because `heapq` is faster due to the lack of thread lock overhead.

#### 4.2.1 Min-Heap

Python's `heapq` is a **Min-Heap** by default. The smallest value is always located at `hq[0]`.

```py
import heapq

hq = []

# Add elements (automatically maintains sorted state)
heapq.heappush(hq, 3)  # [3]
heapq.heappush(hq, 1)  # [1, 3]
heapq.heappush(hq, 4)  # [1, 3, 4]
heapq.heappush(hq, 2)  # [1, 2, 4, 3]

# hq state: [1, 2, 4, 3] 
# Note: The list is not fully sorted, but hq[0] is guaranteed to be the minimum value.

# Remove element (extract minimum)
x = heapq.heappop(hq)  # Result: x=1 / hq=[2, 3, 4]
```

#### 4.2.2 Max-Heap

Python does not explicitly support Max-Heap. The workaround is to negate (-) the values when pushing and negate them again when popping.

```py
import heapq

hq = []

# Add elements
heapq.heappush(hq, -3)  # [-3]
heapq.heappush(hq, -1)  # [-3, -1]
heapq.heappush(hq, -4)  # [-4, -1, -3]
heapq.heappush(hq, -2)  # [-4, -2, -3, -1]

# Remove element
x = -heapq.heappop(hq)  # Result: x=4 / hq=[-3, -2, -1]
```

#### 4.2.3 Tuples

If you insert tuples into the `heapq` module, it compares the elements based on the index order of the tuple; smaller values have higher priority.

```py
import heapq

hq = []

heapq.heappush(hq, (2, "b"))
heapq.heappush(hq, (1, "a"))
heapq.heappush(hq, (1, "c"))

x = heapq.heappop(hq)  # (1, 'a')
y = heapq.heappop(hq)  # (1, 'c')
z = heapq.heappop(hq)  # (2, 'b')
```

--------------------------------------------------------------------------------

## 5 Graph Traversal

You must choose the appropriate traversal algorithm based on the nature of the problem.

- **DFS (Depth-First Search)**
    - Exhaustive path search, Cycle detection, Backtracking, etc.
- **BFS (Breadth-First Search)**
    - Shortest path, Level-order traversal, etc.

--------------------------------------------------------------------------------

### 5.1 Implementation

Given [Figure 2], let's implement DFS using recursion/stack and BFS using a queue.

{{< figure src="02_graph_example.png" width="200" caption="[Figure 2] 그래프 예시: [(Book) Python Algorithm Interview](https://www.onlybook.co.kr/entry/algorithm-interview)">}}

```py
import collections


def dfs_recursive(v, visited=None, order=None):
    if visited is None:
        visited = set()

    if order is None:
        order = []
    
    visited.add(v)
    order.append(v)

    for neighbor in graph[v]:
        if neighbor not in visited:
            dfs_recursive(neighbor, visited, order)

    return order


def dfs_stack(start_v):
    visited = set()
    order = []
    stack = [start_v]

    while stack:
        v = stack.pop()

        if v not in visited:
            visited.add(v)
            order.append(v)

            for neighbor in graph[v]:
                stack.append(neighbor)

    return order


def bfs_queue(start_v):
    visited = set([start_v])
    order = [start_v]
    queue = collections.deque([start_v])

    while queue:
        v = queue.popleft()

        for neighbor in graph[v]:
            if neighbor not in visited:
                visited.add(neighbor)
                order.append(neighbor)
                queue.append(neighbor)

    return order


# Representing the graph as an adjacency list
graph = {
    1: [2, 3, 4],
    2: [5],
    3: [5],
    4: [],
    5: [6, 7],
    6: [],
    7: [3],
}

result = dfs_recursive(1)  # [1, 2, 5, 6, 7, 3, 4]
result = dfs_stack(1)      # [1, 4, 3, 5, 7, 6, 2]
result = bfs_queue(1)      # [1, 2, 3, 4, 5, 6, 7]
```

--------------------------------------------------------------------------------

## 6 Reference

- [(Book) Python Algorithm Interview](https://www.onlybook.co.kr/entry/algorithm-interview)
- [(Web) Python Wiki - TimeComplexity](https://wiki.python.org/moin/TimeComplexity)
