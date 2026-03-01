const express = require('express');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const router = express.Router();

const EXECUTION_TIMEOUT_MS = 5000;

// Submit code solution
router.post('/submit', auth, async (req, res) => {
  try {
    const { problemId, code, language, hintLevel } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Create submission record
    const submission = new Submission({
      userId: req.userId,
      problemId,
      code,
      language,
      hintLevel: hintLevel || 0
    });

    // Simulate code execution (in production, use sandboxed execution)
    const result = evaluateCode(code, problem.testCases);

    submission.result = result;
    submission.status = result.testsPassed === result.totalTests ? 'Accepted' : 'Wrong Answer';

    await submission.save();

    // Update problem statistics
    problem.statistics.totalSubmissions++;
    if (submission.status === 'Accepted') {
      problem.statistics.acceptedSubmissions++;
    }
    problem.statistics.acceptanceRate = 
      (problem.statistics.acceptedSubmissions / problem.statistics.totalSubmissions * 100).toFixed(2);
    await problem.save();

    res.json({
      success: true,
      submission,
      message: submission.status === 'Accepted' ? '✅ All tests passed!' : '❌ Some tests failed'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's submissions
router.get('/user/submissions', auth, async (req, res) => {
  try {
    const { problemId, page = 1, limit = 10 } = req.query;
    let query = { userId: req.userId };

    if (problemId) query.problemId = problemId;

    const skip = (page - 1) * limit;
    const submissions = await Submission.find(query)
      .populate('problemId', 'title difficulty')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ submittedAt: -1 });

    const total = await Submission.countDocuments(query);

    res.json({
      success: true,
      submissions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute code against provided test cases (Run/Submit in coding UI)
router.post('/execute', auth, async (req, res) => {
  try {
    const {
      language,
      code,
      testCases = [],
      includeHidden = false,
      functionName = 'solve',
      persistSubmission = false,
      questionMeta = {}
    } = req.body;

    if (!language || !code) {
      return res.status(400).json({ success: false, message: 'language and code are required' });
    }

    const allowed = ['javascript', 'python', 'java', 'cpp'];
    if (!allowed.includes(language)) {
      return res.status(400).json({ success: false, message: 'Unsupported language' });
    }

    const selectedCases = testCases.filter((tc) => includeHidden || !tc.hidden);
    const started = Date.now();
    const tests = selectedCases.map((testCase, index) =>
      executeSingleTest({ language, code, testCase, functionName, index })
    );

    const runSuccess = tests.length > 0 && tests.every((t) => t.passed);
    const runtimeMs = Date.now() - started;
    const passedCount = tests.filter((t) => t.passed).length;
    const status = runSuccess ? 'Accepted' : 'Wrong Answer';
    let submission = null;

    if (persistSubmission && req.userId) {
      submission = await Submission.create({
        userId: req.userId,
        problemId: questionMeta.problemId || undefined,
        externalQuestionId: questionMeta.questionId ? String(questionMeta.questionId) : undefined,
        questionTitle: questionMeta.title || undefined,
        category: questionMeta.category || undefined,
        difficulty: questionMeta.difficulty || undefined,
        language,
        code,
        status,
        executionMode: includeHidden ? 'submit' : 'run',
        result: {
          testsPassed: passedCount,
          totalTests: selectedCases.length,
          runtime: runtimeMs,
          error: runSuccess ? null : 'One or more test cases failed.'
        }
      });
    }

    return res.json({
      success: true,
      result: {
        success: runSuccess,
        tests,
        runtimeMs,
        executed: selectedCases.length,
        total: testCases.length
      },
      submissionId: submission?._id || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/user/history', auth, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const history = await Submission.find({ userId: req.userId })
      .select('externalQuestionId questionTitle category difficulty language status executionMode result submittedAt')
      .sort({ submittedAt: -1 })
      .limit(limit);

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get submission details
router.get('/:submissionId', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate('userId', 'name avatar')
      .populate('problemId', 'title description');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check if user owns this submission
    if (submission.userId._id.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper function to evaluate code (simplified)
function evaluateCode(code, testCases) {
  try {
    // In production, use a sandboxed JS executor or call a backend service
    // This is a simplified version
    let testsPassed = 0;
    let errors = [];

    testCases.forEach((testCase, index) => {
      try {
        // Very basic evaluation - in production use proper sandboxing
        const result = eval(`(function() { ${code}; return null; })()`);
        testsPassed++;
      } catch (err) {
        errors.push(`Test ${index + 1}: ${err.message}`);
      }
    });

    return {
      testsPassed,
      totalTests: testCases.length,
      error: errors.length > 0 ? errors.join('\n') : null,
      runtime: Math.random() * 100, // Simulated
      memory: Math.random() * 50
    };
  } catch (err) {
    return {
      testsPassed: 0,
      totalTests: testCases.length,
      error: err.message,
      runtime: 0,
      memory: 0
    };
  }
}

function compareOutput(actual, expected, comparator = 'deepEqual') {
  if (comparator === 'unorderedArray') {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    const a = [...actual].sort((x, y) => {
      if (typeof x === 'number' && typeof y === 'number') return x - y;
      return String(x).localeCompare(String(y));
    });
    const b = [...expected].sort((x, y) => {
      if (typeof x === 'number' && typeof y === 'number') return x - y;
      return String(x).localeCompare(String(y));
    });
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function parseProgramOutput(rawOutput) {
  const text = String(rawOutput || '').trim();
  if (!text.length) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

function runCommand(command, args, options = {}) {
  try {
    const result = spawnSync(command, args, {
      timeout: EXECUTION_TIMEOUT_MS,
      encoding: 'utf8',
      ...options
    });
    return {
      ok: result.status === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      error: result.error ? result.error.message : null
    };
  } catch (err) {
    return { ok: false, stdout: '', stderr: '', error: err.message };
  }
}

function runPythonScript(filePath, inputJson) {
  let run = runCommand('python', [filePath, inputJson]);
  if (run.ok) return run;
  const errText = `${run.error || ''} ${run.stderr || ''}`.toLowerCase();
  if (errText.includes('not found') || errText.includes('enoent') || errText.includes('not recognized')) {
    run = runCommand('py', ['-3', filePath, inputJson]);
  }
  return run;
}

function escapeJavaString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function toJavaLiteral(value) {
  if (value === null) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return `"${escapeJavaString(value)}"`;

  if (Array.isArray(value)) {
    if (value.length === 0) return 'new Object[]{}';

    const allNums = value.every((v) => typeof v === 'number');
    if (allNums) return `new int[]{${value.map((v) => String(v)).join(',')}}`;

    const allString = value.every((v) => typeof v === 'string');
    if (allString) return `new String[]{${value.map((v) => `"${escapeJavaString(v)}"`).join(',')}}`;

    const allBool = value.every((v) => typeof v === 'boolean');
    if (allBool) return `new boolean[]{${value.map((v) => (v ? 'true' : 'false')).join(',')}}`;

    const allArray = value.every((v) => Array.isArray(v));
    if (allArray) {
      const allInnerNum = value.every((row) => row.every((v) => typeof v === 'number'));
      if (allInnerNum) {
        return `new int[][]{${value.map((row) => `new int[]{${row.join(',')}}`).join(',')}}`;
      }
      return `new Object[][]{${value.map((row) => `new Object[]{${row.map((v) => toJavaLiteral(v)).join(',')}}`).join(',')}}`;
    }

    return `new Object[]{${value.map((v) => toJavaLiteral(v)).join(',')}}`;
  }

  return 'null';
}

function buildJavaWrapper(userCode, functionName, argsLiteral) {
  return `import java.lang.reflect.*;
import java.util.*;

${userCode}

public class Main {
  private static Object convertArg(Object value, Class<?> target) {
    if (value == null) return null;
    if (target == int.class || target == Integer.class) return ((Number) value).intValue();
    if (target == long.class || target == Long.class) return ((Number) value).longValue();
    if (target == double.class || target == Double.class) return ((Number) value).doubleValue();
    if (target == float.class || target == Float.class) return ((Number) value).floatValue();
    if (target == boolean.class || target == Boolean.class) return (Boolean) value;
    if (target == String.class) return String.valueOf(value);

    if (target.isArray()) {
      Class<?> comp = target.getComponentType();
      if (value.getClass().isArray()) {
        int len = java.lang.reflect.Array.getLength(value);
        Object out = java.lang.reflect.Array.newInstance(comp, len);
        for (int i = 0; i < len; i++) {
          Object item = java.lang.reflect.Array.get(value, i);
          java.lang.reflect.Array.set(out, i, convertArg(item, comp));
        }
        return out;
      }
    }
    return value;
  }

  private static String quote(String s) {
    return Character.toString((char)34) + s + Character.toString((char)34);
  }

  private static String toJson(Object value) {
    if (value == null) return "null";
    if (value instanceof String) return quote((String) value);
    if (value instanceof Number || value instanceof Boolean) return String.valueOf(value);
    Class<?> cls = value.getClass();
    if (cls.isArray()) {
      int len = java.lang.reflect.Array.getLength(value);
      StringBuilder sb = new StringBuilder();
      sb.append("[");
      for (int i = 0; i < len; i++) {
        if (i > 0) sb.append(",");
        sb.append(toJson(java.lang.reflect.Array.get(value, i)));
      }
      sb.append("]");
      return sb.toString();
    }
    if (value instanceof List<?>) {
      List<?> list = (List<?>) value;
      StringBuilder sb = new StringBuilder();
      sb.append("[");
      for (int i = 0; i < list.size(); i++) {
        if (i > 0) sb.append(",");
        sb.append(toJson(list.get(i)));
      }
      sb.append("]");
      return sb.toString();
    }
    return quote(String.valueOf(value));
  }

  public static void main(String[] args) throws Exception {
    Object[] rawArgs = new Object[]{${argsLiteral}};
    Class<?> cls = Class.forName("Solution");
    Object instance = cls.getDeclaredConstructor().newInstance();
    Method targetMethod = null;

    for (Method m : cls.getDeclaredMethods()) {
      if (m.getName().equals("${functionName}") && m.getParameterCount() == rawArgs.length) {
        targetMethod = m;
        break;
      }
    }

    if (targetMethod == null) {
      throw new RuntimeException("Method ${functionName} not found with " + rawArgs.length + " args");
    }

    Class<?>[] paramTypes = targetMethod.getParameterTypes();
    Object[] callArgs = new Object[paramTypes.length];
    for (int i = 0; i < paramTypes.length; i++) {
      callArgs[i] = convertArg(rawArgs[i], paramTypes[i]);
    }

    Object out = targetMethod.invoke(instance, callArgs);
    System.out.print(toJson(out));
  }
}`;
}

function executeSingleTest({ language, code, testCase, functionName, index }) {
  try {
    if (language === 'javascript') {
      const script = `${code}
const fn = (typeof ${functionName} === 'function') ? ${functionName} : null;
if (!fn) { throw new Error('Function ${functionName} not found'); }
const args = JSON.parse(process.argv[1]);
const out = fn(...args);
console.log(JSON.stringify(out));`;
      const inputJson = JSON.stringify(testCase.args || []);
      const run = runCommand('node', ['-e', script, inputJson]);
      if (!run.ok) {
        return {
          id: index + 1,
          passed: false,
          input: testCase.args,
          expected: testCase.expected,
          actual: `Runtime error: ${run.stderr || run.error || 'Unknown error'}`
        };
      }
      const actual = parseProgramOutput(run.stdout);
      return {
        id: index + 1,
        passed: compareOutput(actual, testCase.expected, testCase.comparator),
        input: testCase.args,
        expected: testCase.expected,
        actual
      };
    }

    if (language === 'python') {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-py-'));
      try {
        const filePath = path.join(tempDir, 'solution.py');
        const pyScript = `${code}
import json
import sys
fn = globals().get("${functionName}")
if fn is None:
    raise Exception("Function ${functionName} not found")
args = json.loads(sys.argv[1])
out = fn(*args)
print(json.dumps(out))`;
        fs.writeFileSync(filePath, pyScript, 'utf8');
        const inputJson = JSON.stringify(testCase.args || []);
        const run = runPythonScript(filePath, inputJson);
        if (!run.ok) {
          return {
            id: index + 1,
            passed: false,
            input: testCase.args,
            expected: testCase.expected,
            actual: `Runtime error: ${run.stderr || run.error || 'Unknown error'}`
          };
        }
        const actual = parseProgramOutput(run.stdout);
        return {
          id: index + 1,
          passed: compareOutput(actual, testCase.expected, testCase.comparator),
          input: testCase.args,
          expected: testCase.expected,
          actual
        };
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }

    if (language === 'java') {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-java-'));
      try {
        const sourcePath = path.join(tempDir, 'Main.java');
        // Support two modes:
        // 1) Full program mode when user provides Main class.
        // 2) LeetCode-style mode when user provides Solution class + method.
        const hasMainClass = /class\s+Main\b/.test(code);
        const javaSource = hasMainClass
          ? code
          : buildJavaWrapper(code, functionName, (testCase.args || []).map((arg) => toJavaLiteral(arg)).join(','));
        fs.writeFileSync(sourcePath, javaSource, 'utf8');
        const compile = runCommand('javac', ['Main.java'], { cwd: tempDir });
        if (!compile.ok) {
          return {
            id: index + 1,
            passed: false,
            input: testCase.args,
            expected: testCase.expected,
            actual: `Compilation error: ${compile.stderr || compile.error || 'Unknown error'}`
          };
        }
        const run = runCommand('java', ['Main'], {
          cwd: tempDir,
          input: hasMainClass ? JSON.stringify(testCase.args || []) : undefined
        });
        if (!run.ok) {
          return {
            id: index + 1,
            passed: false,
            input: testCase.args,
            expected: testCase.expected,
            actual: `Runtime error: ${run.stderr || run.error || 'Unknown error'}`
          };
        }
        const actual = parseProgramOutput(run.stdout);
        return {
          id: index + 1,
          passed: compareOutput(actual, testCase.expected, testCase.comparator),
          input: testCase.args,
          expected: testCase.expected,
          actual
        };
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }

    if (language === 'cpp') {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-cpp-'));
      try {
        const sourcePath = path.join(tempDir, 'main.cpp');
        fs.writeFileSync(sourcePath, code, 'utf8');
        const compile = runCommand('g++', ['main.cpp', '-std=c++17', '-O2', '-o', 'main.exe'], { cwd: tempDir });
        if (!compile.ok) {
          return {
            id: index + 1,
            passed: false,
            input: testCase.args,
            expected: testCase.expected,
            actual: `Compilation error: ${compile.stderr || compile.error || 'Unknown error'}`
          };
        }
        const run = runCommand(path.join(tempDir, 'main.exe'), [], {
          cwd: tempDir,
          input: JSON.stringify(testCase.args || [])
        });
        if (!run.ok) {
          return {
            id: index + 1,
            passed: false,
            input: testCase.args,
            expected: testCase.expected,
            actual: `Runtime error: ${run.stderr || run.error || 'Unknown error'}`
          };
        }
        const actual = parseProgramOutput(run.stdout);
        return {
          id: index + 1,
          passed: compareOutput(actual, testCase.expected, testCase.comparator),
          input: testCase.args,
          expected: testCase.expected,
          actual
        };
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }

    return {
      id: index + 1,
      passed: false,
      input: testCase.args,
      expected: testCase.expected,
      actual: 'Unsupported language'
    };
  } catch (err) {
    return {
      id: index + 1,
      passed: false,
      input: testCase.args,
      expected: testCase.expected,
      actual: `Execution error: ${err.message}`
    };
  }
}

module.exports = router;
