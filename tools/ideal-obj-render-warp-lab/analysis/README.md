# p,P Dataset Analysis

`obj_pose_mapping_colab_analysis.py` は、Ideal OBJ Render Warp Lab から出力した
`obj_pose_mapping_dataset_v2` JSON を解析し、`P = F(p)` と実用上の逆関数
`G(P) = p` の候補モデルを比較する Colab / Python 用コードです。

Colab では `# %%` 区切りをセルとして実行できます。

```bash
pip install -r tools/ideal-obj-render-warp-lab/analysis/requirements.txt
python tools/ideal-obj-render-warp-lab/analysis/obj_pose_mapping_colab_analysis.py \
  --input obj-pose-mapping-dataset-current-YYYYMMDD-HHMMSS.json \
  --output-dir obj_pose_mapping_analysis_outputs
```

## 主な処理

- `raw_df`: 外れ値除外前の dataset
- `filtered_df`: hard filter と residual outlier detection 後の dataset
- `excluded_df`: 除外サンプル。`excludedReasons` に理由を複数保持
- raw / filtered の両方で baseline、決定木 + 二次回帰、高次多項式回帰、GMM gate + 二次回帰を比較
- pose-wise evaluation と continuity evaluation を出力
- TypeScript に移植しやすい最良候補を `pose_mapping_profile_candidate.json` として保存

## 出力

- `obj_pose_mapping_analysis_summary.md`
- `obj_pose_mapping_model_comparison.csv`
- `obj_pose_mapping_posewise_evaluation.csv`
- `obj_pose_mapping_excluded_samples.csv`
- `obj_pose_mapping_filtered_samples.csv`
- `obj_pose_mapping_exclusion_by_pose_bucket.csv`
- `pose_mapping_profile_candidate.json`
- `plots/*.png`
