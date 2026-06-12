# p,P Dataset Analysis

`obj_pose_mapping_colab_analysis.py` は、Ideal OBJ Render Warp Lab から出力した
`obj_pose_mapping_dataset_v3` WebGL JSON を解析し、`P = F(p)` と実用上の逆関数
`G(P) = p` の候補モデルを比較する Colab / Python 用コードです。

`renderBackend: "webgl"` ではない dataset は WebGL runtime 用 profile として出力しません。
Canvas2D legacy dataset と WebGL dataset を混ぜないための guard です。

Colab では `# %%` 区切りをセルとして実行できます。

```python
result = run_analysis("/content/obj-pose-mapping-dataset-current-YYYYMMDD-HHMMSS.json")
```

Colab の upload dialog を使う場合:

```python
result = run_analysis()
```

CLI で実行する場合:

```bash
pip install -r tools/ideal-obj-render-warp-lab/analysis/requirements.txt
python tools/ideal-obj-render-warp-lab/analysis/obj_pose_mapping_colab_analysis.py \
  --input obj-pose-mapping-dataset-current-YYYYMMDD-HHMMSS.json \
  --output-dir obj_pose_mapping_analysis_outputs
```

## 主な処理

- `raw_df`: 外れ値除外前の dataset
- `filtered_df`: hard filter と residual outlier detection 後の dataset
- `excluded_df`: 除外サンプル。`excludedReasons` に理由を保存
- raw / filtered の両方で baseline、decision tree + degree2 ridge、high-degree polynomial、GMM gate を比較
- pose-wise evaluation と continuity evaluation を出力
- TypeScript に移植しやすい最良候補を `pose_mapping_profile_candidate.json` として保存
- candidate は `pose_mapping_profile_candidate_v2` として、`requiredRenderBackend` / `requiredRenderer` / `datasetSchemaVersion` を含める

## 出力

- `obj_pose_mapping_analysis_summary.md`
- `obj_pose_mapping_model_comparison.csv`
- `obj_pose_mapping_posewise_evaluation.csv`
- `obj_pose_mapping_excluded_samples.csv`
- `obj_pose_mapping_filtered_samples.csv`
- `obj_pose_mapping_exclusion_by_pose_bucket.csv`
- `pose_mapping_profile_candidate.json`
- `plots/*.png`
