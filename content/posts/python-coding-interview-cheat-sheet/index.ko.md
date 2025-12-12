+++
date = '2025-12-12T14:52:10+09:00'
draft = false
title = '파이썬 코딩 테스트 치트 시트'
tags = ['파이썬', '알고리즘', '자료구조']
translationKey = 'python-coding-interview-cheat-sheet'
+++



이 글은 파이썬으로 코딩 테스트를 준비하며 헷갈렸던 포인트들을 정리한 글입니다. 

혹시 내용 중 궁금한 점이나 수정이 필요한 부분이 있다면 언제든 댓글로 알려주세요. 그럼 시작하겠습니다!

--------------------------------------------------------------------------------

## 1 복잡도

단순히 '동작하는 코드'가 아니라 '**제한 시간 내에 통과하는 코드**'를 짜야 합니다.

{{< figure src="01_bigo_complexity_chart.png" caption="[그림 1] Big-O Complexity Chart: [bigocheatsheet.com](http://bigocheatsheet.com/)" >}}

--------------------------------------------------------------------------------

## 2 표준 라이브러리

파이썬의 표준 라이브러리를 활용하면 구현 시간과 실행 시간을 동시에 단축할 수 있습니다.

--------------------------------------------------------------------------------

### 2.1 `itertools`

순열, 조합 등 모든 경우의 수를 확인해야 할 때 사용합니다.

```py
import itertools

data = ["A", "B", "C", "D"]

# 순열
perm = list(itertools.permutations(data, 3))

# 조합
comb = list(itertools.combinations(data, 3))
```

--------------------------------------------------------------------------------

## 3 정렬

--------------------------------------------------------------------------------

### 3.1 `Lambda`

복잡한 정렬 조건은 `key` 인자에 `lambda`와 '튜플'을 넘겨 해결합니다. 튜플의 인덱스 순서대로 우선순위를 갖습니다.

#### 3.1.1 튜플 or 리스트

```py
data = [
    ("Alex", 58, "DK"), 
    ("Charlie", 23, "US"), 
    ("Bree", 23, "CA"), 
    ("Alex", 28, "GE")
]

sorted_list = sorted(data, key=lambda x: (-x[1], x[0]))

# 결과: [('Alex', 58, 'DK'), 
#       ('Alex', 28, 'GE'), 
#       ('Bree', 23, 'CA'), 
#       ('Charlie', 23, 'US')]
```

#### 3.1.2 딕셔너리

```py
data = [
    {"name": "Bree", "age": 23, "country": "CA"},
    {"name": "Alex", "age": 58, "country": "DK"},
    {"name": "Alex", "age": 28, "country": "GE"},
    {"name": "Charlie", "age": 45, "country": "US"},
]

sorted_list = sorted(data, key=lambda x: (x["age"], x["country"], x["name"]))

# 결과: [{'name': 'Bree', 'age': 23, 'country': 'CA'},
#       {'name': 'Alex', 'age': 28, 'country': 'GE'},
#       {'name': 'Charlie', 'age': 45, 'country': 'US'},
#       {'name': 'Alex', 'age': 58, 'country': 'DK'}]
```

--------------------------------------------------------------------------------

## 4 자료구조

--------------------------------------------------------------------------------

### 4.1 Deque

**Deque(덱)** 은 Double-Ended Queue의 줄임말로, 양쪽 끝에서 데이터를 $O(1)$로 넣거나 뺄 수 있습니다. **큐(Queue) 기능이 필요하면 무조건 Deque를 사용해야 합니다.**

#### 4.1.1 사용법

```py
import collections

dq = collections.deque()

# 요소 추가
dq.append(1)      # 결과: deque([1])
dq.append(2)      # 결과: deque([1, 2])
dq.appendleft(3)  # 결과: deque([3, 1, 2])
dq.appendleft(4)  # 결과: deque([4, 3, 1, 2])

# 요소 제거
dq.pop()      # 결과: deque([4, 3, 1])
dq.popleft()  # 결과: deque([3, 1])
```

--------------------------------------------------------------------------------

### 4.2 Heap

**Priority Queue (우선순위 큐)** 는 '데이터가 들어온 순서와 상관없이, 우선순위가 높은 데이터가 먼저 나간다'라는 **약속(인터페이스)** 이고, **Heap**은 그 약속을 지키기 위해 사용되는 이진 트리 형태의 **자료 구조**입니다. 

파이썬에는 `queue.PriorityQueue`도 있지만, 코딩 테스트에서는 주로 `heapq` 모듈을 사용합니다. `heapq`가 스레드 락(Lock) 오버헤드가 없어 더 빠르기 때문입니다.

#### 4.2.1 최소 힙 (Min-Heap)

파이썬의 `heapq`는 기본적으로 **최소 힙**입니다. 가장 작은 값이 `hq[0]`에 위치합니다.

```py
import heapq

hq = []

# 요소 추가 (자동으로 정렬 상태 유지)
heapq.heappush(hq, 3)  # [3]
heapq.heappush(hq, 1)  # [1, 3]
heapq.heappush(hq, 4)  # [1, 3, 4]
heapq.heappush(hq, 2)  # [1, 2, 4, 3]

# hq 상태: [1, 2, 4, 3] 
# 주의: 리스트가 완전히 정렬된 상태는 아니지만, hq[0]은 항상 최솟값임이 보장됨.

# 요소 제거 (최솟값 추출)
x = heapq.heappop(hq)  # 결과: x=1 / hq=[2, 3, 4]
```

#### 4.2.2 최대 힙 (Max-Heap)

파이썬은 최대 힙을 별도로 지원하지 않습니다. 값을 넣을 때 부호를 반대로(-) 넣고, 꺼낼 때 다시 뒤집는 방식을 사용합니다.

```py
import heapq

hq = []

# 요소 추가
heapq.heappush(hq, -3)  # [-3]
heapq.heappush(hq, -1)  # [-3, -1]
heapq.heappush(hq, -4)  # [-4, -1, -3]
heapq.heappush(hq, -2)  # [-4, -2, -3, -1]

# 요소 제거
x = -heapq.heappop(hq)  # 결과: x=4 / hq=[-3, -2, -1]
```

#### 4.2.3 튜플

`heapq` 모듈에 튜플을 넣으면, 튜플의 인덱스 순서대로 비교하여 작은 값이 더 높은 우선순위를 가집니다.

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

## 5 그래프 탐색

문제의 성격에 따라 적절한 탐색 알고리즘을 선택해야 합니다.

- **깊이 우선 탐색 (DFS; Depth-First Search)**
    - 모든 경로 탐색, 사이클 탐지, 백트래킹, 등
- **너비 우선 탐색 (BFS; Breadth-First Search)**
    - 최단 거리, 단계별 탐색, 등

--------------------------------------------------------------------------------

### 5.1 구현

[그림 2]가 주어졌을 때, DFS를 재귀와 스택으로, BFS를 큐로 구현해 보겠습니다.

{{< figure src="02_graph_example.png" width="200" caption="[그림 2] 그래프 예시: [(책) 파이썬 알고리즘 인터뷰](https://www.onlybook.co.kr/entry/algorithm-interview)">}}

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


# 그래프를 인접 리스트로 표현
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

- [(책) 파이썬 알고리즘 인터뷰](https://www.onlybook.co.kr/entry/algorithm-interview)
- [(웹) Python Wiki - TimeComplexity](https://wiki.python.org/moin/TimeComplexity)
